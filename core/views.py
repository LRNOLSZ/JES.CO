import requests
from django.core.cache import cache
from django.utils import timezone

from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

from .models import PageImages, SiteSettings, SocialLink, Testimonial, IntroVideo, Announcement
from .serializers import (
    PageImagesSerializer, SiteSettingsSerializer,
    SocialLinkSerializer, TestimonialSerializer, IntroVideoSerializer,
    AnnouncementSerializer,
)

RATE_CACHE_KEY          = 'ghs_usd_rate'
RATE_LAST_KNOWN_KEY      = 'ghs_usd_rate_last_known'   # never expires — fallback if the API call fails
RATE_CACHE_TIMEOUT       = 60 * 60 * 24                # refresh once a day


def get_ghs_usd_rate():
    """Returns how many USD one GHS is worth, cached for a day. Display-only —
    never used to compute an actual Paystack charge, so a stale/missing rate
    is never a financial correctness issue, only a cosmetic one."""
    rate = cache.get(RATE_CACHE_KEY)
    if rate is not None:
        return rate
    try:
        resp = requests.get('https://open.er-api.com/v6/latest/GHS', timeout=5)
        resp.raise_for_status()
        rate = resp.json()['rates']['USD']
        cache.set(RATE_CACHE_KEY, rate, timeout=RATE_CACHE_TIMEOUT)
        cache.set(RATE_LAST_KNOWN_KEY, rate, timeout=None)
        return rate
    except Exception:
        return cache.get(RATE_LAST_KNOWN_KEY)


class ExchangeRateView(APIView):
    """GET /api/exchange-rate/ — GHS→USD rate for display-only price estimates."""
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({'ghs_to_usd': get_ghs_usd_rate()})


_EMPTY_PAGE_IMAGES = {
    'home_hero_url': None,
    'home_studio_feature_url': None,
    'studio_portrait_url': None,
    'studio_about_url': None,
    'studio_booking_url': None,
    'studio_testimonials_bg_url': None,
}

class PageImagesView(APIView):
    """GET /api/page-images/ — all site-level image URLs, organised by page."""
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            images = PageImages.objects.get(pk=1)
            return Response(PageImagesSerializer(images, context={'request': request}).data)
        except PageImages.DoesNotExist:
            return Response(_EMPTY_PAGE_IMAGES)


class SiteSettingsView(APIView):
    """GET /api/settings/ — footer contact details and brand tagline."""
    permission_classes = [AllowAny]

    def get(self, request):
        settings = SiteSettings.load()
        return Response(SiteSettingsSerializer(settings, context={'request': request}).data)


class SocialLinkListView(APIView):
    """GET /api/socials/ — active social links ordered by position."""
    permission_classes = [AllowAny]

    def get(self, request):
        links = SocialLink.objects.filter(is_active=True)
        return Response(SocialLinkSerializer(links, many=True).data)


class TestimonialListView(APIView):
    """GET /api/testimonials/ — active testimonials."""
    permission_classes = [AllowAny]

    def get(self, request):
        items = Testimonial.objects.filter(is_active=True)
        return Response(TestimonialSerializer(items, many=True, context={'request': request}).data)


class IntroVideoView(APIView):
    """GET /api/videos/?page=jesoco|studio — active intro video for a page."""
    permission_classes = [AllowAny]

    def get(self, request):
        page = request.query_params.get('page')
        try:
            video = IntroVideo.objects.get(page=page, is_active=True)
            return Response(IntroVideoSerializer(video, context={'request': request}).data)
        except IntroVideo.DoesNotExist:
            return Response(None)


class AnnouncementListView(APIView):
    """GET /api/announcements/ — all active announcements (upcoming, ongoing, and past)."""
    permission_classes = [AllowAny]

    def get(self, request):
        items = Announcement.objects.filter(is_active=True)
        return Response(AnnouncementSerializer(items, many=True, context={'request': request}).data)


class AnnouncementFeaturedView(APIView):
    """GET /api/announcements/featured/ — the one announcement to show in the popup.

    Priority: the soonest-ending ongoing announcement, else the soonest-starting
    upcoming one, else null.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        today = timezone.now().date()
        qs = Announcement.objects.filter(is_active=True)
        featured = (
            qs.filter(start_date__lte=today, end_date__gte=today).order_by('end_date').first()
            or qs.filter(start_date__gt=today).order_by('start_date').first()
        )
        if not featured:
            return Response(None)
        return Response(AnnouncementSerializer(featured, context={'request': request}).data)
