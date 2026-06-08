from django.urls import path
from .views import MeView, RequestMagicLinkView, VerifyMagicLinkView, LogoutView

urlpatterns = [
    path('me/',           MeView.as_view(),               name='accounts-me'),
    path('auth/request/', RequestMagicLinkView.as_view(), name='auth-request'),
    path('auth/verify/',  VerifyMagicLinkView.as_view(),  name='auth-verify'),
    path('auth/logout/',  LogoutView.as_view(),           name='auth-logout'),
]
