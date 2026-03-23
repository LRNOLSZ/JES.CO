from django.urls import path
from .views import SiteSettingsView, SocialLinkListView, TestimonialListView

urlpatterns = [
    path('settings/',     SiteSettingsView.as_view(),     name='site-settings'),
    path('socials/',      SocialLinkListView.as_view(),    name='social-links'),
    path('testimonials/', TestimonialListView.as_view(),   name='testimonials'),
]
