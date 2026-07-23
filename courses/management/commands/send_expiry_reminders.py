import logging

from django.conf import settings
from django.core.management.base import BaseCommand

from courses.models import CoursePurchase, CourseAccessToken
from jesrestudio_backend.email_backends import send_branded_email

logger = logging.getLogger(__name__)


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
                    send_branded_email(
                        purchase.email,
                        title='Access Expired',
                        message=f'Your access to "{purchase.course.title}" on JES.CO has expired. You can renew any time from your dashboard.',
                        details=[('Course', purchase.course.title), ('Days Remaining', '0')],
                        cta_url=link_for(purchase.email),
                        cta_label='Renew Access',
                    )
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
                    send_branded_email(
                        purchase.email,
                        title=f'{days} Day{plural} Left on "{purchase.course.title}"',
                        message=f'Your access to "{purchase.course.title}" on JES.CO expires in {days} day{plural}. View your dashboard or renew below.',
                        details=[('Course', purchase.course.title), ('Days Remaining', str(days))],
                        cta_url=link_for(purchase.email),
                        cta_label='Renew Access',
                    )
                    purchase.reminder_14_sent = True
                    purchase.reminder_5_sent = True
                    purchase.save(update_fields=['reminder_14_sent', 'reminder_5_sent'])
                    sent_count += 1

                elif days <= 14:
                    if purchase.reminder_14_sent:
                        continue
                    send_branded_email(
                        purchase.email,
                        title=f'{days} Days Left on "{purchase.course.title}"',
                        message=f'Your access to "{purchase.course.title}" on JES.CO expires in {days} days. View your dashboard below.',
                        details=[('Course', purchase.course.title), ('Days Remaining', str(days))],
                        cta_url=link_for(purchase.email),
                        cta_label='Renew Access',
                    )
                    purchase.reminder_14_sent = True
                    purchase.save(update_fields=['reminder_14_sent'])
                    sent_count += 1

            except Exception:
                logger.exception('Failed to send expiry reminder for purchase id=%s', purchase.pk)
                # deliberately don't set flags here — a transient failure retries tomorrow

        self.stdout.write(self.style.SUCCESS(f'Sent {sent_count} expiry reminder email(s).'))
