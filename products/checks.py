"""Django system checks for the shop.

Lives here rather than in jesrestudio_backend/storage_backends.py because
settings.py imports that module while settings are still being constructed —
adding `django.conf` / `django.core.checks` imports there causes a circular
import that hangs startup (confirmed by a 5-minute `manage.py check` timeout).
Registered from products/apps.py's ready(), which runs after app loading, the
same pattern courses/apps.py uses for the Bunny signing check.
"""

from django.conf import settings
from django.core.checks import Warning, register

from jesrestudio_backend.storage_backends import R2_CONFIGURED, R2_PRIVATE_CONFIGURED


@register()
def check_private_storage(app_configs, **kwargs):
    """Surfaces a half-configured private bucket at every startup/deploy.

    Without it, digital product PDFs silently fall back to local filesystem
    storage — which on Railway means they vanish on the next deploy, with no
    error anywhere until a customer reports a dead download link.

    A Warning rather than an Error, on purpose: an Error fails `manage.py check`
    and would block Railway's pre-deploy migrate for *every* deploy, including
    ones with nothing to do with digital products. That severity isn't warranted
    here because the fallback is safe — files go to local disk, never to the
    public media bucket — so the failure mode is "uploads don't persist"
    (annoying, quickly obvious) rather than "paid files are public"
    (catastrophic, silent). get_private_storage() is what makes the catastrophic
    case impossible; this check only has to make the annoying one visible.
    """
    if not settings.DEBUG and R2_CONFIGURED and not R2_PRIVATE_CONFIGURED:
        return [Warning(
            'R2_PRIVATE_BUCKET_NAME / R2_PRIVATE_ACCESS_KEY_ID / '
            'R2_PRIVATE_SECRET_ACCESS_KEY are not all set — digital product PDFs '
            'will be written to local filesystem storage and lost on the next '
            'deploy. They are NOT being published to the public media bucket.',
            hint='Create a non-public R2 bucket with its own Object Read & Write '
                 'token and set all three variables. See DEPLOYMENT.md.',
            id='products.W001',
        )]
    return []
