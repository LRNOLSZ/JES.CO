from rest_framework import serializers
from .models import CourseTier, CoursePageSettings, Course


class CourseTierSerializer(serializers.ModelSerializer):
    class Meta:
        model  = CourseTier
        fields = ['id', 'name', 'slug', 'badge_color', 'price_display', 'order']


class CoursePageSettingsSerializer(serializers.ModelSerializer):
    hero_bg_url = serializers.SerializerMethodField()

    class Meta:
        model  = CoursePageSettings
        fields = ['hero_bg_url', 'hero_heading', 'hero_subtext']

    def get_hero_bg_url(self, obj):
        if obj.hero_bg:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.hero_bg.url) if request else obj.hero_bg.url
        return None


class CourseListSerializer(serializers.ModelSerializer):
    """Used for list views — no video URLs to keep payload light."""
    thumbnail_url    = serializers.SerializerMethodField()
    tier             = CourseTierSerializer(read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model  = Course
        fields = [
            'id', 'title', 'slug', 'description',
            'thumbnail_url', 'category', 'category_display',
            'tier', 'duration_display', 'is_featured',
        ]

    def get_thumbnail_url(self, obj):
        if obj.thumbnail:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.thumbnail.url) if request else obj.thumbnail.url
        return None


class CourseDetailSerializer(serializers.ModelSerializer):
    """Full detail including video URLs."""
    thumbnail_url    = serializers.SerializerMethodField()
    trailer_url      = serializers.SerializerMethodField()
    course_video_url = serializers.SerializerMethodField()
    tier             = CourseTierSerializer(read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model  = Course
        fields = [
            'id', 'title', 'slug', 'description', 'what_youll_learn',
            'thumbnail_url', 'category', 'category_display',
            'tier', 'trailer_url', 'course_video_url',
            'duration_display', 'is_featured',
        ]

    def get_thumbnail_url(self, obj):
        if obj.thumbnail:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.thumbnail.url) if request else obj.thumbnail.url
        return None

    def get_trailer_url(self, obj):
        if obj.trailer_video:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.trailer_video.url) if request else obj.trailer_video.url
        return None

    def get_course_video_url(self, obj):
        if obj.course_video:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.course_video.url) if request else obj.course_video.url
        return None
