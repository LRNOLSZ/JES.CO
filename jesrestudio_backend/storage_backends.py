#
# ⚠️ Keep this module free of django.* imports. settings.py imports it while it
# is still being constructed (see its STORAGES block), so importing django.conf
# or django.core.checks here causes a circular import that hangs startup —
# confirmed by a 5-minute `manage.py check` timeout on 2026-11-25. The system
# check that watches this configuration therefore lives in products/checks.py,
# registered from products/apps.py's ready(), which runs after app loading.
from decouple import config

_R2_ACCESS_KEY = config('R2_ACCESS_KEY_ID', default='')
_R2_SECRET_KEY = config('R2_SECRET_ACCESS_KEY', default='')
_R2_BUCKET     = config('R2_BUCKET_NAME', default='')
_R2_ENDPOINT   = config('R2_ENDPOINT_URL', default='')

# Paid files go in a SEPARATE, non-public bucket. This is not optional.
#
# R2 public access is a property of the BUCKET, not the folder: switching on a
# bucket's public r2.dev domain (which the media bucket needs, to serve product
# and gallery images) makes every object in it readable by anyone who knows or
# guesses the path. There is no per-prefix override.
#
# Verified against the live media bucket on 2026-11-25: every path under
# pub-*.r2.dev returns 404 "not found" rather than 403 "forbidden" — i.e. the
# bucket is openly readable and only the object was missing. So a PDF stored
# there under a digital/ prefix would be permanently downloadable with no
# signature, defeating the entire signed-URL mechanism below.
#
# It also gets its OWN API token, not the media one. The media token is scoped
# to the media bucket, so reusing it here would fail with an opaque permissions
# error — and a shared token would mean a leak of either exposes both. Least
# privilege: each token reaches exactly one bucket.
_R2_PRIVATE_BUCKET     = config('R2_PRIVATE_BUCKET_NAME', default='')
_R2_PRIVATE_ACCESS_KEY = config('R2_PRIVATE_ACCESS_KEY_ID', default='')
_R2_PRIVATE_SECRET_KEY = config('R2_PRIVATE_SECRET_ACCESS_KEY', default='')
# Optional. R2 endpoints are account-level, so both buckets normally share one;
# only buckets pinned to a jurisdiction (EU/FedRAMP) need their own host. Left
# unset it falls back to the shared endpoint, so the distinction never has to be
# reasoned about at configuration time.
_R2_PRIVATE_ENDPOINT   = config('R2_PRIVATE_ENDPOINT_URL', default='') or _R2_ENDPOINT

R2_CONFIGURED = all([_R2_ACCESS_KEY, _R2_SECRET_KEY, _R2_BUCKET, _R2_ENDPOINT])
# All three are required — a bucket name with no credentials is as broken as no
# bucket at all, and half-configured is exactly the state worth catching.
R2_PRIVATE_CONFIGURED = all([
    _R2_PRIVATE_BUCKET, _R2_PRIVATE_ACCESS_KEY, _R2_PRIVATE_SECRET_KEY, _R2_PRIVATE_ENDPOINT,
])

if R2_CONFIGURED:
    from storages.backends.s3boto3 import S3Boto3Storage

    class R2MediaStorage(S3Boto3Storage):
        access_key    = _R2_ACCESS_KEY
        secret_key    = _R2_SECRET_KEY
        bucket_name   = _R2_BUCKET
        endpoint_url  = _R2_ENDPOINT
        custom_domain = (config('R2_PUBLIC_DOMAIN', default='') or '').removeprefix('https://').removeprefix('http://') or None
        file_overwrite = False
        default_acl   = None  # R2 does not use ACLs


# Gated on R2_PRIVATE_CONFIGURED, NOT R2_CONFIGURED — this storage shares no
# credentials or bucket with the media storage, so it stands or falls entirely
# on its own three variables.
if R2_PRIVATE_CONFIGURED:
    from storages.backends.s3boto3 import S3Boto3Storage as _S3Boto3Storage

    class R2PrivateStorage(_S3Boto3Storage):
        """
        For PAID files (digital product PDFs) — never public.

        Privacy here rests on TWO independent things, and both are required:

        1. **A separate, non-public bucket.** R2 public access is bucket-wide —
           there is no per-prefix override — so sharing the media bucket (which
           must be public to serve images) would expose every PDF at a guessable
           path. Verified against the live media bucket 2026-11-25: arbitrary
           paths return 404 "not found", not 403 "forbidden".
        2. **`custom_domain` stays None.** R2MediaStorage deliberately sets it to
           the public domain, and when django-storages sees a custom_domain it
           skips presigning entirely and returns a permanent, world-readable URL.
           Correct for product photos; fatal for a paid PDF.

        Either alone is insufficient. With both, `.url()` returns a presigned URL
        that expires after querystring_expire.

        The customer never meets an expired link: the account page mints a fresh
        one on every load, so what is permanent is their *entitlement*, not any
        particular URL. Same split as the Bunny signed video URLs.
        """
        access_key     = _R2_PRIVATE_ACCESS_KEY   # dedicated token, not the media one
        secret_key     = _R2_PRIVATE_SECRET_KEY
        bucket_name    = _R2_PRIVATE_BUCKET       # NOT the public media bucket
        endpoint_url   = _R2_PRIVATE_ENDPOINT
        custom_domain  = None   # see docstring — never set this
        querystring_auth   = True
        querystring_expire = 86400   # 24h
        # ⚠️ REQUIRED for R2. Without this boto3 presigns with Signature Version 2
        # (AWSAccessKeyId/Signature/Expires params) and Cloudflare R2 rejects it
        # with 401 — R2 only accepts SigV4. Caught on 2026-11-25 by actually
        # fetching a generated URL; the URL *looked* signed, so inspecting the
        # config alone would never have revealed it. R2MediaStorage doesn't need
        # this because custom_domain means it never presigns at all.
        signature_version  = 's3v4'
        file_overwrite = False
        default_acl    = None   # R2 does not use ACLs


def get_private_storage():
    """
    Storage for FileFields holding paid content.

    Passed to FileField as a *callable* rather than an instance on purpose:
    Django then stores a reference to this function in the migration instead of
    baking in a concrete storage class, so swapping backends (or running with R2
    unconfigured locally) never needs a new migration.

    ⚠️ Falls back to the local filesystem when the private bucket isn't
    configured — deliberately NOT to the media bucket or media credentials. That
    fallback would silently publish paid files at a guessable public URL, which
    is far worse than uploads simply not persisting. Local storage is wrong but
    safe; check_private_storage() above makes the misconfiguration visible.
    """
    if R2_PRIVATE_CONFIGURED:
        return R2PrivateStorage()
    from django.core.files.storage import FileSystemStorage
    return FileSystemStorage()
