from rest_framework import serializers
from .models import SiteSettings, SocialLink, Testimonial, IntroVideo


class SiteSettingsSerializer(serializers.ModelSerializer):
    hero_bg_url          = serializers.SerializerMethodField()
    studio_bg_url        = serializers.SerializerMethodField()
    testimonials_bg_url  = serializers.SerializerMethodField()

    class Meta:
        model  = SiteSettings
        fields = ['tagline', 'email', 'phone', 'location', 'hero_bg_url', 'studio_bg_url', 'testimonials_bg_url']

    def get_hero_bg_url(self, obj):
        if obj.hero_bg:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.hero_bg.url) if request else obj.hero_bg.url
        return None

    def get_studio_bg_url(self, obj):
        if obj.studio_bg:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.studio_bg.url) if request else obj.studio_bg.url
        return None

    def get_testimonials_bg_url(self, obj):
        if obj.testimonials_bg:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.testimonials_bg.url) if request else obj.testimonials_bg.url
        return None


class SocialLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model  = SocialLink
        fields = ['id', 'platform', 'handle', 'url', 'order']


class TestimonialSerializer(serializers.ModelSerializer):
    profile_picture_url = serializers.SerializerMethodField()

    class Meta:
        model  = Testimonial
        fields = ['id', 'name', 'location', 'comment', 'profile_picture_url', 'order']

    def get_profile_picture_url(self, obj):
        if obj.profile_picture:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.profile_picture.url) if request else obj.profile_picture.url
        return None


class IntroVideoSerializer(serializers.ModelSerializer):
    video_url = serializers.SerializerMethodField()

    class Meta:
        model  = IntroVideo
        fields = ['id', 'page', 'title', 'video_url', 'is_active']

    def get_video_url(self, obj):
        if obj.video_file:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.video_file.url) if request else obj.video_file.url
        return None
