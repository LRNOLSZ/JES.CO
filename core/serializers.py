from rest_framework import serializers
from .models import PageImages, SiteSettings, SocialLink, Testimonial, IntroVideo, Announcement


class PageImagesSerializer(serializers.ModelSerializer):
    home_hero_url              = serializers.ImageField(source='home_hero',              use_url=True, allow_null=True, read_only=True)
    home_studio_feature_url    = serializers.ImageField(source='home_studio_feature',    use_url=True, allow_null=True, read_only=True)
    studio_portrait_url        = serializers.ImageField(source='studio_portrait',        use_url=True, allow_null=True, read_only=True)
    studio_about_url           = serializers.ImageField(source='studio_about',           use_url=True, allow_null=True, read_only=True)
    studio_booking_url         = serializers.ImageField(source='studio_booking',         use_url=True, allow_null=True, read_only=True)
    studio_testimonials_bg_url = serializers.ImageField(source='studio_testimonials_bg', use_url=True, allow_null=True, read_only=True)

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


class SiteSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model  = SiteSettings
        fields = ['tagline', 'email', 'phone', 'location']


class SocialLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model  = SocialLink
        fields = ['id', 'platform', 'handle', 'url', 'order']


class TestimonialSerializer(serializers.ModelSerializer):
    # Rename fields to match what the frontend component expects
    client_name    = serializers.CharField(source='name')
    quote          = serializers.CharField(source='comment')
    avatar_url     = serializers.ImageField(source='profile_picture', use_url=True, allow_null=True, read_only=True)
    before_image_url = serializers.ImageField(source='before_image', use_url=True, allow_null=True, read_only=True)
    after_image_url  = serializers.ImageField(source='after_image',  use_url=True, allow_null=True, read_only=True)

    class Meta:
        model  = Testimonial
        fields = [
            'id', 'testimonial_type', 'client_name', 'quote', 'avatar_url',
            'before_image_url', 'after_image_url', 'rating', 'service', 'location', 'order',
        ]


class IntroVideoSerializer(serializers.ModelSerializer):
    video_url = serializers.SerializerMethodField()

    def get_video_url(self, obj):
        if not obj.video_url:
            return None
        try:
            url = obj.video_url.url
            if url.startswith('http'):
                return url
            request = self.context.get('request')
            return request.build_absolute_uri(url) if request else url
        except Exception:
            return None

    class Meta:
        model  = IntroVideo
        fields = ['id', 'page', 'title', 'video_url', 'is_active']


class AnnouncementSerializer(serializers.ModelSerializer):
    image_url = serializers.ImageField(source='image', use_url=True, allow_null=True, read_only=True)

    class Meta:
        model  = Announcement
        fields = ['id', 'title', 'description', 'image_url', 'start_date', 'end_date', 'status', 'order']
