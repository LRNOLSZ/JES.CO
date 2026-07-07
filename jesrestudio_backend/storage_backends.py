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
