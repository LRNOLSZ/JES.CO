from urllib.parse import quote

from django.conf import settings
from django.core.mail import get_connection

from rest_framework import status as drf_status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from .models import ProductItem
from .serializers import OrderSerializer, ProductItemSerializer


def _build_whatsapp_url(text):
    number = getattr(settings, 'WHATSAPP_NUMBER', '')
    if not number:
        return None
    return f'https://wa.me/{number}?text={quote(text)}'


def _send_notification_email(subject, body):
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


class ProductItemListView(APIView):
    """
    GET /api/products/                → all active products
    GET /api/products/?category=makeup|skincare|collections → filtered by category
    """
    permission_classes = [AllowAny]

    def get(self, request):
        qs = ProductItem.objects.filter(is_active=True)
        category = request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)
        return Response(ProductItemSerializer(qs, many=True, context={'request': request}).data)


class ProductItemDetailView(APIView):
    """GET /api/products/<pk>/"""
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            item = ProductItem.objects.get(pk=pk, is_active=True)
            return Response(ProductItemSerializer(item, context={'request': request}).data)
        except ProductItem.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=drf_status.HTTP_404_NOT_FOUND)


class OrderCreateView(APIView):
    """POST /api/orders/ — create order, notify Maame Ama via email + return WhatsApp URL."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OrderSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=drf_status.HTTP_400_BAD_REQUEST)

        order = serializer.save()
        items_text = '\n'.join(
            f'  - {i.name} x{i.quantity} @ {i.price}'
            for i in order.items.all()
        )
        wa_text = (
            f"New Order #{order.pk} — JES.CO\n\n"
            f"Name: {order.full_name}\n"
            f"Email: {order.email}\n"
            f"Phone: {order.phone}\n"
            f"Address: {order.address or 'N/A'}\n"
            f"Notes: {order.notes or 'N/A'}\n\n"
            f"Items:\n{items_text}\n\n"
            f"Total: {order.total}"
        )
        whatsapp_url = _build_whatsapp_url(wa_text)

        _send_notification_email(
            subject=f'New Order #{order.pk} — {order.full_name}',
            body=wa_text,
        )

        return Response({
            'detail': 'Order received.',
            'order_id': order.pk,
            'whatsapp_url': whatsapp_url,
        }, status=drf_status.HTTP_201_CREATED)
