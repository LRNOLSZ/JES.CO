from decouple import config

_CLOUD_NAME = config('CLOUDINARY_CLOUD_NAME', default='')
_API_KEY    = config('CLOUDINARY_API_KEY',    default='')
_API_SECRET = config('CLOUDINARY_API_SECRET', default='')

CLOUDINARY_CONFIGURED = all([_CLOUD_NAME, _API_KEY, _API_SECRET])

if CLOUDINARY_CONFIGURED:
    import cloudinary
    cloudinary.config(
        cloud_name=_CLOUD_NAME,
        api_key=_API_KEY,
        api_secret=_API_SECRET,
        secure=True,
    )
    from cloudinary_storage.storage import VideoMediaCloudinaryStorage as _Base

    class CloudinaryVideoStorage(_Base):
        pass
else:
    from django.core.files.storage import FileSystemStorage as CloudinaryVideoStorage
