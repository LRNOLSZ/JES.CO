from django.utils import timezone
from rest_framework import serializers
from .models import CourseTier, CoursePageSettings, Course, CourseComment


def _video_url(request, value):
    """Return an absolute URL for a video FileField (local or Cloudinary)."""
    if not value:
        return None
    try:
        url = value.url
        if url.startswith('http'):
            return url
        return request.build_absolute_uri(url)
    except Exception:
        return None


def _get_session_email(request):
    """Extract the email from a validated X-Course-Session header, or None."""
    if not request:
        return None
    session_key = request.META.get('HTTP_X_COURSE_SESSION', '').strip()
    if not session_key:
        return None
    from .models import CourseSession
    try:
        session = CourseSession.objects.get(session_key=session_key)
        if session.is_expired:
            return None
        return session.email
    except CourseSession.DoesNotExist:
        return None


class CourseTierSerializer(serializers.ModelSerializer):
    class Meta:
        model  = CourseTier
        fields = ['id', 'name', 'slug', 'badge_color', 'price_display', 'order']


class CoursePageSettingsSerializer(serializers.ModelSerializer):
    hero_bg_url = serializers.ImageField(source='hero_bg', use_url=True, allow_null=True, read_only=True)

    class Meta:
        model  = CoursePageSettings
        fields = ['hero_bg_url', 'hero_heading', 'hero_subtext']


class CourseListSerializer(serializers.ModelSerializer):
    thumbnail_url    = serializers.ImageField(source='thumbnail', use_url=True, allow_null=True, read_only=True)
    trailer_url      = serializers.SerializerMethodField()
    tier             = CourseTierSerializer(read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    def get_trailer_url(self, obj):
        return _video_url(self.context['request'], obj.trailer_video)

    class Meta:
        model  = Course
        fields = [
            'id', 'title', 'slug', 'description',
            'thumbnail_url', 'trailer_url', 'category', 'category_display',
            'tier', 'price', 'duration_display', 'is_featured',
        ]


class CourseDetailSerializer(serializers.ModelSerializer):
    thumbnail_url    = serializers.ImageField(source='thumbnail', use_url=True, allow_null=True, read_only=True)
    trailer_url      = serializers.SerializerMethodField()
    course_video_url = serializers.SerializerMethodField()
    has_access       = serializers.SerializerMethodField()
    tier             = CourseTierSerializer(read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    approved_comments = serializers.SerializerMethodField()

    def get_trailer_url(self, obj):
        return _video_url(self.context.get('request'), obj.trailer_video)

    def get_has_access(self, obj):
        email = _get_session_email(self.context.get('request'))
        if not email:
            return False
        return obj.purchases.filter(email=email).exists()

    def get_course_video_url(self, obj):
        if not self.get_has_access(obj):
            return None
        return _video_url(self.context.get('request'), obj.course_video)

    def get_approved_comments(self, obj):
        qs = obj.comments.filter(is_approved=True).order_by('-created_at')[:20]
        return CourseCommentSerializer(qs, many=True).data

    class Meta:
        model  = Course
        fields = [
            'id', 'title', 'slug', 'description', 'what_youll_learn',
            'thumbnail_url', 'category', 'category_display',
            'tier', 'price', 'trailer_url', 'course_video_url', 'has_access',
            'subtitle_url', 'duration_display', 'is_featured',
            'approved_comments',
        ]


class CourseCommentSerializer(serializers.ModelSerializer):
    class Meta:
        model  = CourseComment
        fields = ['id', 'email', 'body', 'created_at']
