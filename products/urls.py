from django.urls import path
from .views import (
    DeliveryZoneListView,
    OrderCreateView,
    OrderTrackingView,
    PaystackWebhookView,
    ProductItemDetailView,
    ProductItemListView,
)

urlpatterns = [
    path('',                        ProductItemListView.as_view(),   name='product-list'),
    path('<int:pk>/',               ProductItemDetailView.as_view(), name='product-detail'),
    path('orders/',                 OrderCreateView.as_view(),       name='order-create'),
    path('paystack/webhook/',       PaystackWebhookView.as_view(),   name='paystack-webhook'),
]
