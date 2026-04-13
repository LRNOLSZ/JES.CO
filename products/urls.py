from django.urls import path
from .views import ProductItemListView, ProductItemDetailView

urlpatterns = [
    path('',        ProductItemListView.as_view(),  name='product-list'),
    path('<int:pk>/', ProductItemDetailView.as_view(), name='product-detail'),
]
