from decouple import config

_R2_ACCESS_KEY = config('R2_ACCESS_KEY_ID', default='')
_R2_SECRET_KEY = config('R2_SECRET_ACCESS_KEY', default='')
_R2_BUCKET     = config('R2_BUCKET_NAME', default='')
_R2_ENDPOINT   = config('R2_ENDPOINT_URL', default='')

R2_CONFIGURED = all([_R2_ACCESS_KEY, _R2_SECRET_KEY, _R2_BUCKET, _R2_ENDPOINT])

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

    class R2PrivateStorage(S3Boto3Storage):
        """
        For PAID files (digital product PDFs) — never public.

        ⚠️ `custom_domain` MUST stay None. R2MediaStorage above deliberately sets
        it to the public `pub-*.r2.dev` domain, and when django-storages sees a
        custom_domain it skips presigning entirely and returns a permanent,
        world-readable URL. Correct for product photos; fatal for a paid PDF —
        one shared link and the product is free forever, with no way to revoke it.
        With custom_domain None + querystring_auth, `.url()` returns a presigned
        URL that expires.

        The customer never meets an expired link: the account page mints a fresh
        URL on every load, so what's permanent is their *entitlement*, not any
        particular URL. Same split as the Bunny signed video URLs.
        """
        access_key     = _R2_ACCESS_KEY
        secret_key     = _R2_SECRET_KEY
        bucket_name    = _R2_BUCKET
        endpoint_url   = _R2_ENDPOINT
        custom_domain  = None   # see docstring — do not set this
        querystring_auth   = True
        querystring_expire = 86400   # 24h
        file_overwrite = False
        default_acl    = None   # R2 does not use ACLs


def get_private_storage():
    """
    Storage for FileFields holding paid content.

    Passed to FileField as a *callable* rather than an instance on purpose:
    Django then stores a reference to this function in the migration instead of
    baking in a concrete storage class, so swapping backends (or running with R2
    unconfigured locally) never needs a new migration.

    Falls back to local filesystem storage when R2 isn't configured, matching how
    settings.py's STORAGES already degrades for development.
    """
    if R2_CONFIGURED:
        return R2PrivateStorage()
    from django.core.files.storage import FileSystemStorage
    return FileSystemStorage()
