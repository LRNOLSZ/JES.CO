import hmac
import hashlib
import logging

from django.conf import settings

from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status as drf_status

from courses.views import _process_course_charge
from products.views import _process_product_charge
from skin_analysis.views import _process_skin_analysis_charge

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([])
def paystack_webhook(request):
    """
    POST /api/paystack/webhook/
    Single Paystack webhook URL for the whole project (Paystack only allows one
    per account/mode). Verifies the signature once, then routes to course-purchase
    or shop-order handling based on what's in the event's metadata.

    Exempt from the site-wide anon throttle (F-13): every purchase type shares this
    one URL, plus Paystack's own webhook retries, so the generic per-minute cap could
    otherwise reject a legitimate delivery. The HMAC signature check below is the
    real authentication here, not IP/rate-based — trust that instead.
    """
    secret_key = getattr(settings, 'PAYSTACK_SECRET_KEY', '')
    if not secret_key:
        return Response({'detail': 'Paystack not configured.'}, status=drf_status.HTTP_503_SERVICE_UNAVAILABLE)

    signature = request.META.get('HTTP_X_PAYSTACK_SIGNATURE', '')
    expected  = hmac.new(secret_key.encode(), request.body, hashlib.sha512).hexdigest()
    if not hmac.compare_digest(signature, expected):
        return Response({'detail': 'Invalid signature.'}, status=drf_status.HTTP_400_BAD_REQUEST)

    event = request.data
    if event.get('event') != 'charge.success':
        return Response({'detail': 'Ignored.'})

    data = event.get('data', {})
    meta = data.get('metadata', {})

    if meta.get('course_slug'):
        return _process_course_charge(data)
    if meta.get('skin_analysis_submission_id'):
        return _process_skin_analysis_charge(data)
    if 'items' in meta or 'delivery_zone_id' in meta:
        return _process_product_charge(data)

    logger.warning(f'Paystack webhook: unrecognized metadata shape, ignored. meta keys={list(meta.keys())}')
    return Response({'detail': 'Ignored — unrecognized metadata.'})
