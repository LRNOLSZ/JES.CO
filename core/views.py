from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

from .models import SiteSettings, SocialLink, Testimonial, IntroVideo
from .serializers import SiteSettingsSerializer, SocialLinkSerializer, TestimonialSerializer, IntroVideoSerializer


class SiteSettingsView(APIView):
    """GET /api/settings/ — returns contact details for the footer."""
    permission_classes = [AllowAny]

    def get(self, request):
        settings = SiteSettings.load()
        return Response(SiteSettingsSerializer(settings, context={'request': request}).data)


class SocialLinkListView(APIView):
    """GET /api/socials/ — returns all active social links ordered by position."""
    permission_classes = [AllowAny]

    def get(self, request):
        links = SocialLink.objects.filter(is_active=True)
        return Response(SocialLinkSerializer(links, many=True).data)


class TestimonialListView(APIView):
    """GET /api/testimonials/ — returns all active testimonials."""
    permission_classes = [AllowAny]

    def get(self, request):
        items = Testimonial.objects.filter(is_active=True)
        return Response(TestimonialSerializer(items, many=True, context={'request': request}).data)


class IntroVideoView(APIView):
    """GET /api/videos/?page=jesoco|studio — returns the active intro video for a page."""
    permission_classes = [AllowAny]

    def get(self, request):
        page = request.query_params.get('page')
        try:
            video = IntroVideo.objects.get(page=page, is_active=True)
            return Response(IntroVideoSerializer(video, context={'request': request}).data)
        except IntroVideo.DoesNotExist:
            return Response(None)
