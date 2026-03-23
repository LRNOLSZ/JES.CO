from django.urls import path
from .views import GalleryListView, GalleryDetailView

urlpatterns = [
    path('', GalleryListView.as_view(), name='gallery-list'),
    path('<int:pk>/', GalleryDetailView.as_view(), name='gallery-detail'),
]
