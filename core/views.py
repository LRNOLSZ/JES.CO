from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

from .models import PageImages, SiteSettings, SocialLink, Testimonial, IntroVideo
from .serializers import (
    PageImagesSerializer, SiteSettingsSerializer,
    SocialLinkSerializer, TestimonialSerializer, IntroVideoSerializer,
)


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
