from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from products.views import DeliveryZoneListView, OrderTrackingView
from .views import paystack_webhook

urlpatterns = [
    path('tweneboa/', admin.site.urls),
    path('api/accounts/',        include('accounts.urls')),
    path('api/bookings/',        include('bookings.urls')),
    path('api/gallery/',         include('gallery.urls')),
    path('api/products/',        include('products.urls')),
    path('api/delivery-zones/',  DeliveryZoneListView.as_view(), name='delivery-zones'),
    path('api/orders/track/',    OrderTrackingView.as_view(),    name='order-track'),
    path('api/paystack/webhook/', paystack_webhook,              name='paystack-webhook'),
    path('api/',                 include('courses.urls')),
    path('api/',                 include('core.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
