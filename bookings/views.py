from urllib.parse import quote

from django.conf import settings
from django.core.mail import get_connection

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import BookingRequest
from .serializers import BookingRequestSerializer


def _build_whatsapp_url(text):
    number = getattr(settings, 'WHATSAPP_NUMBER', '')
    if not number:
        return None
    return f'https://wa.me/{number}?text={quote(text)}'


def _send_notification_email(subject, body):
    """Send plain 8-bit email to Maame Ama."""
    from email.mime.text import MIMEText
    to = getattr(settings, 'MAAME_AMA_EMAIL', '')
    if not to:
        return
    mime = MIMEText(body, 'plain', 'utf-8')
    del mime['Content-Transfer-Encoding']
    mime['Content-Transfer-Encoding'] = '8bit'
    mime['Subject'] = subject
    mime['From']    = settings.DEFAULT_FROM_EMAIL
    mime['To']      = to

    class _Msg:
        def message(self): return mime
        def recipients(self): return [to]
        extra_headers = {}

    conn = get_connection()
    conn.open()
    conn.send_messages([_Msg()])
    conn.close()


class BookingRequestCreateView(APIView):
    """POST /api/bookings/ — create a booking request."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = BookingRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        booking = serializer.save()

        # WhatsApp message
        wa_text = (
            f"New Booking Request — Jesres Glam Studio\n\n"
            f"Name: {booking.full_name}\n"
            f"Email: {booking.email}\n"
            f"Phone: {booking.phone}\n"
            f"Service: {booking.get_service_type_display()}\n"
            f"Date: {booking.preferred_date}\n"
            f"Message: {booking.message or 'N/A'}"
        )
        whatsapp_url = _build_whatsapp_url(wa_text)

        # Email notification
        _send_notification_email(
            subject=f'New Booking: {booking.get_service_type_display()} — {booking.full_name}',
            body=wa_text,
        )

        return Response({
            'detail': 'Booking request received.',
            'whatsapp_url': whatsapp_url,
        }, status=status.HTTP_201_CREATED)
