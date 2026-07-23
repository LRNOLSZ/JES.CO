import logging
import sys
from email.utils import parseaddr

import requests
from decouple import config
from django.conf import settings

logger = logging.getLogger(__name__)

_BREVO_API_KEY    = config('BREVO_API_KEY', default='')
BREVO_TEMPLATE_ID = 2  # the shared JES.CO branded template — every outgoing email uses it


def send_branded_email(to_email, *, title, message, first_name='there',
                        cta_url=None, cta_label=None, details=None, footnote='',
                        preheader=None, fail_silently=True):
    """
    Sends every outgoing email through the shared JES.CO branded Brevo template
    (id 2), via Brevo's HTTP API — Railway (and similar hosts) block outbound
    SMTP by default, confirmed via a real TimeoutError connecting to
    smtp-relay.brevo.com:587 in production, so this uses HTTPS instead.

    `message` (and anything else with line breaks) must use '<br>' — this goes
    straight into the template's HTML, not plain text.
    `details`: optional list of up to 3 (label, value) tuples for the template's
    detail-row card; padded blank if fewer than 3 are given.
    `cta_url`/`cta_label` default to the site homepage / "Visit JES.CO" so the
    template's button is never left blank for emails with no specific action.
    """
    details = list(details or [])
    while len(details) < 3:
        details.append(('', ''))

    params = {
        'PREHEADER':  preheader or title,
        'TITLE':      title,
        'FIRST_NAME': first_name,
        'MESSAGE':    message,
        'FOOTNOTE':   footnote,
        'CTA_URL':    cta_url or settings.FRONTEND_URL,
        'CTA_LABEL':  cta_label or 'Visit JES.CO',
    }
    for i, (label, value) in enumerate(details[:3], start=1):
        params[f'LABEL_{i}'] = label
        params[f'VALUE_{i}'] = value

    if settings.DEBUG:
        msg_out = f'\n{"="*60}\n[DEV] Branded email to {to_email}\nTitle: {title}\nParams: {params}\n{"="*60}\n'
        sys.stderr.write(msg_out)
        sys.stderr.flush()
        logger.warning(msg_out)
        return

    name, sender_email = parseaddr(settings.DEFAULT_FROM_EMAIL)
    payload = {
        'sender':     {'email': sender_email, 'name': name} if name else {'email': sender_email},
        'to':         [{'email': to_email}],
        'subject':    title,
        'templateId': BREVO_TEMPLATE_ID,
        'params':     params,
    }
    try:
        resp = requests.post(
            'https://api.brevo.com/v3/smtp/email',
            json=payload,
            headers={'api-key': _BREVO_API_KEY, 'Content-Type': 'application/json'},
            timeout=15,
        )
        resp.raise_for_status()
    except Exception:
        if not fail_silently:
            raise
        logger.exception('Failed to send branded email to %s', to_email)
