from django.urls import path
from . import views

urlpatterns = [
    # Specific paths FIRST — before the <slug> wildcard
    path('courses/access/request/',         views.request_access_link,  name='course-access-request'),
    path('courses/access/verify/',          views.verify_access_token,  name='course-access-verify'),
    path('courses/access/session/',         views.logout_session,       name='course-session-logout'),
    path('courses/dashboard/',              views.course_dashboard,     name='course-dashboard'),

    # Course list + detail (slug wildcard after specific paths)
    path('courses/',                        views.course_list,          name='course-list'),
    path('courses/<slug:slug>/heartbeat/',  views.video_heartbeat,      name='course-heartbeat'),
    path('courses/<slug:slug>/comments/',   views.post_comment,         name='course-comment'),
    path('courses/<slug:slug>/purchase-check/', views.check_purchase,   name='course-purchase-check'),
    path('courses/<slug:slug>/',            views.course_detail,        name='course-detail'),

    # Tier + settings
    path('course-tiers/',                   views.course_tier_list,     name='course-tier-list'),
    path('course-page-settings/',           views.course_page_settings, name='course-page-settings'),
]
