import logging
import sys

from django.conf import settings
from django.core.mail import EmailMessage
from django.core.management.base import BaseCommand

from courses.models import CoursePurchase, CourseAccessToken

logger = logging.getLogger(__name__)


def _send_reminder_email(to_email, subject, body):
    if settings.DEBUG:
        msg_out = f'\n{"="*60}\n[DEV] Reminder email for {to_email}:\n{subject}\n{body}\n{"="*60}\n'
        sys.stderr.write(msg_out)
        sys.stderr.flush()
        logger.warning(msg_out)
        return
    msg = EmailMessage(subject=subject, body=body, from_email=settings.DEFAULT_FROM_EMAIL, to=[to_email])
    msg.encoding = 'ascii'
    msg.send(fail_silently=False)


class Command(BaseCommand):
    help = 'Send 14-day, 5-day, and expiry reminder emails for course access nearing/past expiry.'

    def handle(self, *args, **options):
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        email_tokens = {}  # one CourseAccessToken per email per run — see plan notes on create_for_email

        def link_for(email):
            if email not in email_tokens:
                token = CourseAccessToken.create_for_email(email, expiry_hours=24)
                email_tokens[email] = token.token
            return f'{frontend_url}/studio/courses/access/verify?token={email_tokens[email]}'

        purchases = (CoursePurchase.objects
                     .filter(expires_at__isnull=False)
                     .exclude(expiry_notice_sent=True)
                     .select_related('course'))

        sent_count = 0
        for purchase in purchases:
            try:
                if purchase.is_access_expired:
                    if purchase.expiry_notice_sent:
                        continue
                    subject = f'Your access to "{purchase.course.title}" has expired'
                    body = (
                        f"Hello,\n\nYour access to \"{purchase.course.title}\" on JES.CO has expired.\n\n"
                        f"You can renew any time from your dashboard:\n{link_for(purchase.email)}\n\n"
                        f"-- The JES.CO Team"
                    )
                    _send_reminder_email(purchase.email, subject, body)
                    purchase.reminder_14_sent = True
                    purchase.reminder_5_sent = True
                    purchase.expiry_notice_sent = True
                    purchase.save(update_fields=['reminder_14_sent', 'reminder_5_sent', 'expiry_notice_sent'])
                    sent_count += 1
                    continue

                days = purchase.days_remaining
                if days is None:
                    continue

                if days <= 5:
                    if purchase.reminder_5_sent:
                        continue
                    plural = '' if days == 1 else 's'
                    subject = f'{days} day{plural} left on "{purchase.course.title}"'
                    body = (
                        f"Hello,\n\nYour access to \"{purchase.course.title}\" on JES.CO expires in "
                        f"{days} day{plural}.\n\nView your dashboard or renew here:\n{link_for(purchase.email)}\n\n"
                        f"-- The JES.CO Team"
                    )
                    _send_reminder_email(purchase.email, subject, body)
                    purchase.reminder_14_sent = True
                    purchase.reminder_5_sent = True
                    purchase.save(update_fields=['reminder_14_sent', 'reminder_5_sent'])
                    sent_count += 1

                elif days <= 14:
                    if purchase.reminder_14_sent:
                        continue
                    subject = f'{days} days left on "{purchase.course.title}"'
                    body = (
                        f"Hello,\n\nYour access to \"{purchase.course.title}\" on JES.CO expires in "
                        f"{days} days.\n\nView your dashboard here:\n{link_for(purchase.email)}\n\n"
                        f"-- The JES.CO Team"
                    )
                    _send_reminder_email(purchase.email, subject, body)
                    purchase.reminder_14_sent = True
                    purchase.save(update_fields=['reminder_14_sent'])
                    sent_count += 1

            except Exception:
                logger.exception('Failed to send expiry reminder for purchase id=%s', purchase.pk)
                # deliberately don't set flags here — a transient failure retries tomorrow

        self.stdout.write(self.style.SUCCESS(f'Sent {sent_count} expiry reminder email(s).'))
