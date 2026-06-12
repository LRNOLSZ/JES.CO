from rest_framework import serializers
from .models import PageImages, SiteSettings, SocialLink, Testimonial, IntroVideo


def abs_url(request, field_file):
    """Return absolute URL for an image/file field, or None."""
    if not field_file:
        return None
    return request.build_absolute_uri(field_file.url) if request else field_file.url


class PageImagesSerializer(serializers.ModelSerializer):
    home_hero_url              = serializers.SerializerMethodField()
    home_studio_feature_url    = serializers.SerializerMethodField()
    studio_portrait_url        = serializers.SerializerMethodField()
    studio_about_url           = serializers.SerializerMethodField()
    studio_booking_url         = serializers.SerializerMethodField()
    studio_testimonials_bg_url = serializers.SerializerMethodField()

    class Meta:
        model  = PageImages
        fields = [
            'home_hero_url',
            'home_studio_feature_url',
            'studio_portrait_url',
            'studio_about_url',
            'studio_booking_url',
            'studio_testimonials_bg_url',
        ]

    def get_home_hero_url(self, obj):
        return abs_url(self.context.get('request'), obj.home_hero)

    def get_home_studio_feature_url(self, obj):
        return abs_url(self.context.get('request'), obj.home_studio_feature)

    def get_studio_portrait_url(self, obj):
        return abs_url(self.context.get('request'), obj.studio_portrait)

    def get_studio_about_url(self, obj):
        return abs_url(self.context.get('request'), obj.studio_about)

    def get_studio_booking_url(self, obj):
        return abs_url(self.context.get('request'), obj.studio_booking)

    def get_studio_testimonials_bg_url(self, obj):
        return abs_url(self.context.get('request'), obj.studio_testimonials_bg)


class SiteSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model  = SiteSettings
        fields = ['tagline', 'email', 'phone', 'location']


class SocialLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model  = SocialLink
        fields = ['id', 'platform', 'handle', 'url', 'order']


class TestimonialSerializer(serializers.ModelSerializer):
    profile_picture_url = serializers.SerializerMethodField()

    class Meta:
        model  = Testimonial
        fields = ['id', 'name', 'location', 'comment', 'profile_picture_url', 'rating', 'service', 'order']

    def get_profile_picture_url(self, obj):
        return abs_url(self.context.get('request'), obj.profile_picture)


class IntroVideoSerializer(serializers.ModelSerializer):
    video_url = serializers.SerializerMethodField()

    class Meta:
        model  = IntroVideo
        fields = ['id', 'page', 'title', 'video_url', 'is_active']

    def get_video_url(self, obj):
        return abs_url(self.context.get('request'), obj.video_file)
