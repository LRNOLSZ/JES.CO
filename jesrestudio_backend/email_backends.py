from email.utils import parseaddr

import requests
from decouple import config
from django.core.mail.backends.base import BaseEmailBackend

_BREVO_API_KEY = config('BREVO_API_KEY', default='')
BREVO_API_CONFIGURED = bool(_BREVO_API_KEY)


class BrevoAPIBackend(BaseEmailBackend):
    """
    Sends via Brevo's HTTP transactional email API instead of SMTP. Railway (and
    several similar hosts) block outbound SMTP by default as an anti-spam measure —
    confirmed via a real TimeoutError connecting to smtp-relay.brevo.com:587 in
    production. Regular HTTPS isn't blocked, so this calls the same Brevo account
    over its API instead of SMTP.
    """
    def send_messages(self, email_messages):
        if not email_messages:
            return 0
        sent = 0
        for message in email_messages:
            try:
                name, email = parseaddr(message.from_email)
                payload = {
                    'sender': {'email': email, 'name': name} if name else {'email': email},
                    'to': [{'email': r} for r in message.to],
                    'subject': message.subject,
                    'textContent': message.body,
                }
                resp = requests.post(
                    'https://api.brevo.com/v3/smtp/email',
                    json=payload,
                    headers={'api-key': _BREVO_API_KEY, 'Content-Type': 'application/json'},
                    timeout=15,
                )
                resp.raise_for_status()
                sent += 1
            except Exception:
                if not self.fail_silently:
                    raise
        return sent
