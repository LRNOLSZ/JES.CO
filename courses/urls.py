from django.urls import path
from . import views

urlpatterns = [
    path('courses/',                  views.course_list,          name='course-list'),
    path('courses/<slug:slug>/',      views.course_detail,        name='course-detail'),
    path('course-tiers/',             views.course_tier_list,     name='course-tier-list'),
    path('course-page-settings/',     views.course_page_settings, name='course-page-settings'),
]
