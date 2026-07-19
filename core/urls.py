from django.urls import path
from .views import (
    PageImagesView, SiteSettingsView, SocialLinkListView, TestimonialListView, IntroVideoView,
    AnnouncementListView, AnnouncementFeaturedView, ExchangeRateView,
)

urlpatterns = [
    path('page-images/', PageImagesView.as_view(),      name='page-images'),
    path('settings/',    SiteSettingsView.as_view(),    name='site-settings'),
    path('socials/',     SocialLinkListView.as_view(),  name='social-links'),
    path('testimonials/', TestimonialListView.as_view(), name='testimonials'),
    path('videos/',      IntroVideoView.as_view(),      name='intro-video'),
    path('announcements/featured/', AnnouncementFeaturedView.as_view(), name='announcements-featured'),
    path('announcements/',          AnnouncementListView.as_view(),     name='announcements'),
    path('exchange-rate/',          ExchangeRateView.as_view(),         name='exchange-rate'),
]
