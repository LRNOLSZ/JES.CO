from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from products.views import (
    DeliveryZoneListView, OrderTrackingView,
    request_shop_access_link, shop_account, shop_logout, verify_shop_token,
)
from .views import paystack_webhook

urlpatterns = [
    path('tweneboa/', admin.site.urls),
    path('api/accounts/',        include('accounts.urls')),
    path('api/skin-analysis/',   include('skin_analysis.urls')),
    path('api/gallery/',         include('gallery.urls')),
    path('api/products/',        include('products.urls')),
    path('api/delivery-zones/',  DeliveryZoneListView.as_view(), name='delivery-zones'),
    path('api/orders/track/',    OrderTrackingView.as_view(),    name='order-track'),

    # Customer account — orders + digital downloads behind a magic-link session.
    # Separate from the course access endpoints in courses/urls.py on purpose:
    # shop and course access are independent (see ShopSession's docstring).
    path('api/shop/access/request/', request_shop_access_link, name='shop-access-request'),
    path('api/shop/access/verify/',  verify_shop_token,        name='shop-access-verify'),
    path('api/shop/access/session/', shop_logout,              name='shop-logout'),
    path('api/shop/account/',        shop_account,             name='shop-account'),

    path('api/paystack/webhook/', paystack_webhook,              name='paystack-webhook'),
    path('api/',                 include('courses.urls')),
    path('api/',                 include('core.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
