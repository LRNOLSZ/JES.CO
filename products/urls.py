from django.urls import path
from .views import (
    DeliveryZoneListView,
    OrderCreateView,
    OrderTrackingView,
    ProductItemBySlugView,
    ProductItemDetailView,
    ProductItemListView,
)

urlpatterns = [
    path('',                        ProductItemListView.as_view(),   name='product-list'),
    path('orders/',                 OrderCreateView.as_view(),       name='order-create'),
    # Before the <int:pk> route so 'by-slug' can never be read as an id.
    path('by-slug/<slug:slug>/',    ProductItemBySlugView.as_view(), name='product-by-slug'),
    path('<int:pk>/',               ProductItemDetailView.as_view(), name='product-detail'),
]
