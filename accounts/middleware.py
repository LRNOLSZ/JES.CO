from django.conf import settings
from django.http import HttpResponse


class MediaAccessMiddleware:
    """
    Protects /media/premium/ paths from unauthenticated or expired users.
    All other media (e.g. /media/gallery/) is publicly accessible.
    """

    PROTECTED_PREFIX = f'{settings.MEDIA_URL}premium/'

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path.startswith(self.PROTECTED_PREFIX):
            user = request.user
            if not user.is_authenticated:
                return HttpResponse('Authentication required.', status=401)
            if not user.is_subscription_active:
                return HttpResponse('Your subscription has expired.', status=403)

        return self.get_response(request)
