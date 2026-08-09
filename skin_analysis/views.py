from django.conf import settings
from django.core.cache import cache
from django.utils.html import escape

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from jesrestudio_backend.email_backends import send_branded_email
from core.views import get_client_ip

from .models import SkinAnalysisSubmission, SKIN_ANALYSIS_PRICE_USD
from .serializers import SkinAnalysisSubmissionSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def price(request):
    """GET /api/skin-analysis/price/ — single source of truth so the frontend never hardcodes it."""
    return Response({'price_usd': str(SKIN_ANALYSIS_PRICE_USD)})


@api_view(['POST'])
@permission_classes([AllowAny])
def submit_analysis(request):
    """
    POST /api/skin-analysis/submit/
    Stages the 10 quiz answers unpaid — nothing is sent to Maame Ama yet.
    The frontend takes the returned id and opens Paystack; the webhook
    (_process_skin_analysis_charge) is what actually notifies her, on payment.
    Rate limited: 5 submissions per hour per IP — this endpoint has no auth
    gate (no session/purchase to check, unlike course comments), so IP is the
    only identity available at this point.
    """
    ip = get_client_ip(request)
    rate_key = f'skin_analysis_submit_rate_{ip}'
    submit_count = cache.get(rate_key, 0)
    if submit_count >= 5:
        return Response({'detail': 'Too many requests. Please try again later.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)

    serializer = SkinAnalysisSubmissionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    submission = serializer.save()
    cache.set(rate_key, submit_count + 1, timeout=60 * 60)
    return Response({'id': submission.id}, status=status.HTTP_201_CREATED)


def _process_skin_analysis_charge(data):
    """Handles a verified charge.success event whose metadata identifies a skin analysis payment."""
    submission_id = data.get('metadata', {}).get('skin_analysis_submission_id')
    reference     = data.get('reference', '')
    amount_pesewas = data.get('amount', 0)

    if not submission_id:
        return Response({'detail': 'Missing skin_analysis_submission_id in metadata.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        submission = SkinAnalysisSubmission.objects.get(pk=submission_id)
    except SkinAnalysisSubmission.DoesNotExist:
        return Response({'detail': 'Submission not found.'}, status=status.HTTP_404_NOT_FOUND)

    # Paystack retries webhook delivery until it gets a 200 — skip if this
    # reference already went through, so the admin alert doesn't re-send.
    if submission.is_paid and submission.paystack_reference == reference:
        return Response({'detail': 'Already processed.'})

    # The amount charged is set client-side, so it can be tampered with in
    # devtools before the popup opens. Enforce the real price here — same
    # pattern as course/shop checkout — before ever notifying Maame Ama.
    # $100 is the standard quoted price, but Paystack (Ghana account) can only
    # settle in GHS, so the expected charge is that USD price converted to GHS
    # at today's rate — same mechanism as the shop's USA checkout path.
    from core.views import get_ghs_usd_rate
    rate = get_ghs_usd_rate()
    rate_unavailable = not rate
    expected_ghs = (float(SKIN_ANALYSIS_PRICE_USD) / rate) if rate else None

    # A fixed rate is applied independently on both ends (frontend at checkout,
    # backend here) from separately-cached snapshots, so a small legitimate
    # drift is expected — same relative tolerance used for shop USA orders.
    tolerance = max(1.0, (expected_ghs or 0) * 0.02)
    mismatch  = rate_unavailable or (amount_pesewas / 100 + tolerance < expected_ghs)

    if mismatch:
        alert_key = f'price_mismatch_alerted_{reference}'
        admin_email = getattr(settings, 'MAAME_AMA_EMAIL', '')
        if admin_email and not cache.get(alert_key):
            cache.set(alert_key, True, timeout=60 * 60 * 24 * 7)
            expected_line = (
                'Could not verify — exchange rate unavailable.'
                if rate_unavailable else f'GHS {expected_ghs:.2f}'
            )
            send_branded_email(
                admin_email,
                title='Underpaid Skin Analysis Charge Flagged',
                message=(
                    f'A skin analysis payment from {submission.email} was flagged and NOT sent to you.<br><br>'
                    f'This usually means the checkout amount was tampered with client-side, '
                    f'or the exchange rate could not be verified.'
                ),
                details=[
                    ('Expected', expected_line),
                    ('Actual', f'GHS {amount_pesewas / 100:.2f}'),
                    ('Reference', reference),
                ],
                cta_url=f'{settings.BACKEND_URL}/tweneboa/',
                cta_label='Open Admin',
            )
        return Response({'detail': 'Flagged for review.'})

    submission.is_paid = True
    submission.paystack_reference = reference
    submission.amount_paid = amount_pesewas / 100
    submission.save(update_fields=['is_paid', 'paystack_reference', 'amount_paid'])

    admin_email = getattr(settings, 'MAAME_AMA_EMAIL', '')
    if admin_email:
        send_branded_email(
            admin_email,
            title='New Skin Analysis Consultation',
            message=(
                f'{escape(submission.full_name) or submission.email} has paid for a skin analysis consultation '
                f'(${SKIN_ANALYSIS_PRICE_USD:.2f}, charged as GHS {submission.amount_paid:.2f} at today\'s rate). '
                f'Review their answers below and reply to them personally at {submission.email}.'
            ),
            details=[
                ('Skin Tone', submission.get_skin_tone_display()),
                ('Undertone', submission.get_undertone_display()),
                ('Skin Type', submission.get_skin_type_display()),
            ],
            footnote=(
                f'Concern: {submission.get_skin_concern_display()} · '
                f'Allergies: {submission.get_allergies_display()}'
                + (f' ({escape(submission.allergies_detail)})' if submission.allergies_detail else '') + ' · '
                f'Routine: {submission.get_makeup_routine_display()} · '
                f'Finish: {submission.get_foundation_finish_display()} · '
                f'Occasion: {submission.get_occasion_display()} · '
                f'Budget: {submission.get_budget_display()}'
                + (f' · Notes: {escape(submission.additional_notes)}' if submission.additional_notes else '')
            ),
            cta_url=f'{settings.BACKEND_URL}/tweneboa/skin_analysis/skinanalysissubmission/{submission.pk}/change/',
            cta_label='View Full Submission',
        )

    return Response({'detail': 'Payment confirmed. Thank you!'})
