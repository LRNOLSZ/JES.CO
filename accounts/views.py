from django.conf import settings
from django.core.cache import cache
from django.core.mail import get_connection
from django.utils import timezone

from rest_framework import status
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token

from .models import MagicLinkToken, User, UserSession
from .serializers import UserSerializer


class _EightBitEmail:
    """
    Wraps an email body and exposes .message() so Django backends
    (including console) can send it with Content-Transfer-Encoding: 8bit.
    The '=' in query-string URLs is never mangled to '=3D'.
    """
    def __init__(self, subject, body, from_email, to):
        from email.mime.text import MIMEText
        mime = MIMEText(body, 'plain', 'utf-8')
        del mime['Content-Transfer-Encoding']
        mime['Content-Transfer-Encoding'] = '8bit'
        mime['Subject'] = subject
        mime['From']    = from_email
        mime['To']      = to
        self._mime = mime

    def message(self):
        return self._mime

    def recipients(self):
        return [self._mime['To']]

    extra_headers = {}


def _send_magic_link_email(to, name, link, expiry_minutes):
    body = (
        f"Hello {name},\n\n"
        f"Click the link below to access your courses.\n"
        f"This link expires in {expiry_minutes} minutes and can only be used once.\n\n"
        f"{link}\n\n"
        f"If you did not request this, you can safely ignore this email.\n\n"
        f"-- The JES.CO Team"
    )
    msg = _EightBitEmail(
        subject='Your JES.CO Login Link',
        body=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=to,
    )
    connection = get_connection()
    connection.open()
    connection.send_messages([msg])
    connection.close()


class MeView(RetrieveUpdateAPIView):
    """
    GET  /api/accounts/me/  — return the authenticated user's profile.
    PATCH /api/accounts/me/ — update allowed fields (first_name, last_name, email).
    """
    serializer_class   = UserSerializer
    permission_classes = [IsAuthenticated]
    http_method_names  = ['get', 'patch', 'head', 'options']

    def get_object(self):
        return self.request.user


class RequestMagicLinkView(APIView):
    """
    POST /api/accounts/auth/request/
    Body: { "email": "student@example.com" }

    If the email belongs to a registered user, sends a one-time magic link.
    Always returns 200 so we don't leak whether the email exists.
    Rate-limited: max 3 requests per email per 10 minutes.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({'detail': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # --- Rate limit: 3 attempts per email per 10 min ---
        cache_key = f'magic_link_rate_{email}'
        attempts  = cache.get(cache_key, 0)
        if attempts >= 3:
            return Response(
                {'detail': 'Too many requests. Please wait 10 minutes before trying again.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
        cache.set(cache_key, attempts + 1, timeout=600)  # 10 minutes

        # --- Send link only if user exists ---
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response({'detail': 'If that email is registered, a magic link has been sent.'})

        expiry_minutes = getattr(settings, 'MAGIC_LINK_EXPIRY_MINUTES', 15)
        magic = MagicLinkToken.create_for_user(user, expiry_minutes=expiry_minutes)

        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        link = f'{frontend_url}/auth/verify?token={magic.token}'

        _send_magic_link_email(
            to=user.email,
            name=user.first_name or user.email,
            link=link,
            expiry_minutes=expiry_minutes,
        )

        return Response({'detail': 'If that email is registered, a magic link has been sent.'})


class VerifyMagicLinkView(APIView):
    """
    GET /api/accounts/auth/verify/?token=xxx

    Validates the one-time token, issues a DRF auth token, enforces 2-device limit.
    Returns: { token, user: { email, subscription_tier, expiry_date, is_subscription_active } }
    """
    permission_classes = [AllowAny]

    def get(self, request):
        raw_token = request.query_params.get('token', '').strip()
        if not raw_token:
            return Response({'detail': 'Token is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            magic = MagicLinkToken.objects.select_related('user').get(token=raw_token)
        except MagicLinkToken.DoesNotExist:
            return Response({'detail': 'Invalid or expired link.'}, status=status.HTTP_400_BAD_REQUEST)

        if magic.is_used:
            return Response({'detail': 'This link has already been used.'}, status=status.HTTP_400_BAD_REQUEST)

        if magic.is_expired:
            return Response({'detail': 'This link has expired. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)

        # Consume the token
        magic.is_used = True
        magic.save(update_fields=['is_used'])

        user = magic.user

        # --- 2-device limit: revoke oldest session if at limit ---
        MAX_SESSIONS = 2
        existing_sessions = UserSession.objects.filter(user=user).order_by('last_used')
        if existing_sessions.count() >= MAX_SESSIONS:
            oldest = existing_sessions.first()
            oldest.token.delete()  # cascades to UserSession via OneToOne

        # Issue a fresh DRF token
        Token.objects.filter(user=user).delete()
        auth_token = Token.objects.create(user=user)

        device_hint = request.META.get('HTTP_USER_AGENT', '')[:200]
        UserSession.objects.create(user=user, token=auth_token, device_hint=device_hint)

        return Response({
            'token': auth_token.key,
            'user':  UserSerializer(user).data,
        })


class LogoutView(APIView):
    """
    POST /api/accounts/auth/logout/
    Deletes the user's auth token and session record.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response({'detail': 'Logged out successfully.'})
