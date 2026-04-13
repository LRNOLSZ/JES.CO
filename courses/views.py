from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from .models import CourseTier, CoursePageSettings, Course
from .serializers import (
    CourseTierSerializer,
    CoursePageSettingsSerializer,
    CourseListSerializer,
    CourseDetailSerializer,
)


@api_view(['GET'])
@permission_classes([AllowAny])
def course_tier_list(request):
    tiers = CourseTier.objects.filter(is_active=True)
    return Response(CourseTierSerializer(tiers, many=True).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def course_page_settings(request):
    settings = CoursePageSettings.load()
    serializer = CoursePageSettingsSerializer(settings, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def course_list(request):
    qs = Course.objects.filter(is_active=True).select_related('tier')
    featured = request.query_params.get('featured')
    if featured == 'true':
        qs = qs.filter(is_featured=True)[:3]
    serializer = CourseListSerializer(qs, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def course_detail(request, slug):
    try:
        course = Course.objects.select_related('tier').get(slug=slug, is_active=True)
    except Course.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
    serializer = CourseDetailSerializer(course, context={'request': request})
    return Response(serializer.data)
