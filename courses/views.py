import logging
import secrets
import sys
from django.conf import settings
from django.core.cache import cache
from django.core.mail import EmailMessage
from django.utils import timezone

logger = logging.getLogger(__name__)

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from .models import (
    CourseTier, CoursePageSettings, Course,
    CoursePurchase, CourseAccessToken, CourseSession,
    VideoHeartbeat, CourseComment,
)
from .serializers import (
    CourseTierSerializer,
    CoursePageSettingsSerializer,
    CourseListSerializer,
    CourseDetailSerializer,
    CourseCommentSerializer,
)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _send_access_link_email(to_email, link):
    if settings.DEBUG:
        msg_out = f'\n{"="*60}\n[DEV] Course access link for {to_email}:\n{link}\n{"="*60}\n'
        sys.stderr.write(msg_out)
        sys.stderr.flush()
        logger.warning(msg_out)
        return  # skip email sending in dev — link is printed above

    body = (
        f"Hello,\n\n"
        f"Click the link below to access your JES.CO courses.\n"
        f"This link expires in 24 hours and can only be used once.\n\n"
        f"{link}\n\n"
        f"After clicking, you'll see all courses purchased with this email.\n\n"
        f"If you did not request this, you can safely ignore this email.\n\n"
        f"-- The JES.CO Team"
    )
    msg = EmailMessage(
        subject='Your JES.CO Course Access Link',
        body=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[to_email],
    )
    msg.encoding = 'ascii'
    msg.send(fail_silently=False)


def _resolve_session(request):
    """Return CourseSession for X-Course-Session header, or None."""
    session_key = request.META.get('HTTP_X_COURSE_SESSION', '').strip()
    if not session_key:
        return None
    try:
        session = CourseSession.objects.get(session_key=session_key)
        if session.is_expired:
            return None
        return session
    except CourseSession.DoesNotExist:
        return None


# ── Public course endpoints ───────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def course_tier_list(request):
    tiers = CourseTier.objects.filter(is_active=True)
    return Response(CourseTierSerializer(tiers, many=True).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def course_page_settings(request):
    obj = CoursePageSettings.load()
    return Response(CoursePageSettingsSerializer(obj, context={'request': request}).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def course_list(request):
    qs = Course.objects.filter(is_active=True).select_related('tier')
    if request.query_params.get('featured') == 'true':
        qs = qs.filter(is_featured=True)[:3]
    return Response(CourseListSerializer(qs, many=True, context={'request': request}).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def course_detail(request, slug):
    try:
        course = Course.objects.select_related('tier').get(slug=slug, is_active=True)
    except Course.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
    return Response(CourseDetailSerializer(course, context={'request': request}).data)


# ── Access link request (loginless magic link) ────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def request_access_link(request):
    """
    POST /api/courses/access/request/
    Body: { "email": "student@example.com" }
    Sends magic link only if email has at least one purchase.
    Rate limited: 10 requests per minute per IP.
    """
    ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', '')).split(',')[0].strip()
    cache_key = f'magic_link_rate_{ip}'
    request_count = cache.get(cache_key, 0)
    if request_count >= 10:
        return Response({'detail': 'Too many requests. Please wait a minute before trying again.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)
    cache.set(cache_key, request_count + 1, timeout=60)

    email = request.data.get('email', '').strip().lower()
    if not email:
        return Response({'detail': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

    has_purchases = CoursePurchase.objects.filter(email=email).exists()
    if not has_purchases:
        return Response({'detail': 'No courses found for this email address.'}, status=status.HTTP_404_NOT_FOUND)

    access_token = CourseAccessToken.create_for_email(email, expiry_hours=24)
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    link = f'{frontend_url}/studio/courses/access/verify?token={access_token.token}'

    _send_access_link_email(email, link)

    return Response({'detail': 'Access link sent. Check your inbox.'})


@api_view(['GET'])
@permission_classes([AllowAny])
def verify_access_token(request):
    """
    GET /api/courses/access/verify/?token=xxx
    Validates token, creates a CourseSession (max 2 per email — oldest auto-kicked).
    Returns: { session_key, email }
    """
    raw_token = request.query_params.get('token', '').strip()
    if not raw_token:
        return Response({'detail': 'Token is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        access_token = CourseAccessToken.objects.get(token=raw_token)
    except CourseAccessToken.DoesNotExist:
        return Response({'detail': 'Invalid or expired link.'}, status=status.HTTP_400_BAD_REQUEST)

    if access_token.is_used:
        return Response({'detail': 'This link has already been used.'}, status=status.HTTP_400_BAD_REQUEST)

    if access_token.is_expired:
        return Response({'detail': 'This link has expired. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)

    access_token.is_used = True
    access_token.save(update_fields=['is_used'])

    device_hint = request.META.get('HTTP_USER_AGENT', '')
    session = CourseSession.create_for_email(access_token.email, device_hint=device_hint)

    return Response({'session_key': session.session_key, 'email': session.email})


@api_view(['GET'])
@permission_classes([AllowAny])
def course_dashboard(request):
    """
    GET /api/courses/dashboard/
    Header: X-Course-Session: <session_key>
    Returns list of purchased courses for the session email.
    """
    session = _resolve_session(request)
    if not session:
        return Response({'detail': 'Invalid or expired session.'}, status=status.HTTP_401_UNAUTHORIZED)

    purchases = CoursePurchase.objects.filter(email=session.email).select_related('course__tier')

    course_data = []
    for p in purchases:
        if not p.course.is_active:
            continue
        serialized = CourseListSerializer(p.course, context={'request': request}).data
        serialized['expires_at']   = p.expires_at.isoformat() if p.expires_at else None
        serialized['is_expired']   = p.is_access_expired
        serialized['days_remaining'] = p.days_remaining
        course_data.append(serialized)

    return Response({'email': session.email, 'courses': course_data})


@api_view(['DELETE'])
@permission_classes([AllowAny])
def logout_session(request):
    """
    DELETE /api/courses/access/session/
    Header: X-Course-Session: <session_key>
    Deletes the current session (sign out of this device).
    """
    session = _resolve_session(request)
    if session:
        session.delete()
    return Response({'detail': 'Signed out.'})


# ── Video heartbeat (concurrent stream limit) ─────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def video_heartbeat(request, slug):
    """
    POST /api/courses/<slug>/heartbeat/
    Header: X-Course-Session: <session_key>
    Called every 30s while video plays. Returns { allowed: true/false }.
    Max 2 concurrent streams per email+course.
    """
    session = _resolve_session(request)
    if not session:
        return Response({'allowed': False, 'reason': 'session_invalid'})

    try:
        course = Course.objects.get(slug=slug, is_active=True)
    except Course.DoesNotExist:
        return Response({'allowed': False, 'reason': 'course_not_found'})

    purchase = CoursePurchase.objects.filter(email=session.email, course=course).first()
    if not purchase:
        return Response({'allowed': False, 'reason': 'not_purchased'})
    if purchase.is_access_expired:
        return Response({'allowed': False, 'reason': 'access_expired'})

    cutoff = timezone.now() - timezone.timedelta(seconds=60)
    active_count = VideoHeartbeat.objects.filter(
        course=course,
        last_ping__gte=cutoff,
    ).exclude(session_key=session.session_key).count()

    if active_count >= 2:
        return Response({
            'allowed': False,
            'reason': 'This video is already playing on 2 other devices. Close it there first, then try again.',
        })

    VideoHeartbeat.objects.update_or_create(
        session_key=session.session_key,
        course=course,
        defaults={'ip_address': request.META.get('REMOTE_ADDR', '0.0.0.0')},
    )

    return Response({'allowed': True})


# ── Comments ──────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def post_comment(request, slug):
    """
    POST /api/courses/<slug>/comments/
    Header: X-Course-Session: <session_key>
    Body: { "body": "..." }
    Requires a valid session + purchase. Comment goes into moderation queue.
    """
    session = _resolve_session(request)
    if not session:
        return Response({'detail': 'Invalid session.'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        course = Course.objects.get(slug=slug, is_active=True)
    except Course.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    if not CoursePurchase.objects.filter(email=session.email, course=course).exists():
        return Response({'detail': 'You have not purchased this course.'}, status=status.HTTP_403_FORBIDDEN)

    body = request.data.get('body', '').strip()
    if not body:
        return Response({'detail': 'Comment cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)

    comment = CourseComment.objects.create(course=course, email=session.email, body=body)
    return Response(
        {'detail': 'Comment submitted for review. Thank you!'},
        status=status.HTTP_201_CREATED,
    )


# ── Paystack (Phase 6 — wired when keys are in .env) ─────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def paystack_webhook(request):
    """
    POST /api/courses/paystack/webhook/
    Receives confirmed payment from Paystack, creates CoursePurchase, sends access link.
    Inactive until PAYSTACK_SECRET_KEY is set in .env.
    """
    secret_key = getattr(settings, 'PAYSTACK_SECRET_KEY', '')
    if not secret_key:
        return Response({'detail': 'Paystack not configured.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    import hmac, hashlib
    signature = request.META.get('HTTP_X_PAYSTACK_SIGNATURE', '')
    body      = request.body
    expected  = hmac.new(secret_key.encode(), body, hashlib.sha512).hexdigest()
    if not hmac.compare_digest(signature, expected):
        return Response({'detail': 'Invalid signature.'}, status=status.HTTP_400_BAD_REQUEST)

    event = request.data
    if event.get('event') != 'charge.success':
        return Response({'detail': 'Ignored.'})

    data       = event.get('data', {})
    email      = data.get('customer', {}).get('email', '').lower()
    course_slug = data.get('metadata', {}).get('course_slug', '')
    reference  = data.get('reference', '')

    if not email or not course_slug:
        return Response({'detail': 'Missing email or course_slug in metadata.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        course = Course.objects.get(slug=course_slug, is_active=True)
    except Course.DoesNotExist:
        return Response({'detail': 'Course not found.'}, status=status.HTTP_404_NOT_FOUND)

    # Skip if already processed — Paystack retries webhook delivery until it gets
    # a 200, which would otherwise re-send the access link email on every retry.
    if CoursePurchase.objects.filter(paystack_reference=reference).exists():
        return Response({'detail': 'Already processed.'})

    CoursePurchase.objects.update_or_create(
        email=email,
        course=course,
        defaults={
            'paystack_reference': reference,
            'expires_at': timezone.now() + timezone.timedelta(days=180),
            'reminder_14_sent': False,
            'reminder_5_sent': False,
            'expiry_notice_sent': False,
        },
    )

    access_token = CourseAccessToken.create_for_email(email, expiry_hours=24)
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    link = f'{frontend_url}/studio/courses/access/verify?token={access_token.token}'
    _send_access_link_email(email, link)

    return Response({'detail': 'Purchase recorded and access link sent.'})
