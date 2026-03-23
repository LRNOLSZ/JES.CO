from django.utils import timezone
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny

from .models import GalleryItem
from .serializers import GalleryItemSerializer


class GalleryListView(ListAPIView):
    """
    GET /api/gallery/
    Public endpoint — returns all live gallery items (publish_at is set and in the past).
    No authentication required.
    """
    serializer_class = GalleryItemSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return GalleryItem.objects.filter(publish_at__lte=timezone.now())


class GalleryDetailView(RetrieveAPIView):
    """
    GET /api/gallery/<pk>/
    Public endpoint — returns a single live gallery item.
    No authentication required.
    """
    serializer_class = GalleryItemSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return GalleryItem.objects.filter(publish_at__lte=timezone.now())
