from django import forms
from django.contrib import admin
from django.contrib.admin.widgets import AdminFileWidget
from unfold.admin import ModelAdmin

from .models import CourseTier, CoursePageSettings, Course


class CourseAdminForm(forms.ModelForm):
    class Meta:
        model  = Course
        fields = '__all__'
        widgets = {
            'thumbnail':    AdminFileWidget(attrs={'accept': 'image/*'}),
            'trailer_video': AdminFileWidget(attrs={'accept': 'video/*'}),
            'course_video':  AdminFileWidget(attrs={'accept': 'video/*'}),
        }


class CoursePageSettingsForm(forms.ModelForm):
    class Meta:
        model  = CoursePageSettings
        fields = '__all__'
        widgets = {
            'hero_bg': AdminFileWidget(attrs={'accept': 'image/*'}),
        }


@admin.register(CourseTier)
class CourseTierAdmin(ModelAdmin):
    list_display  = ('name', 'price_display', 'badge_color', 'order', 'is_active')
    list_editable = ('price_display', 'order', 'is_active')
    ordering      = ('order', 'name')
    fields        = ('name', 'slug', 'badge_color', 'price_display', 'order', 'is_active')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(CoursePageSettings)
class CoursePageSettingsAdmin(ModelAdmin):
    form = CoursePageSettingsForm
    fieldsets = (
        ('Hero Section', {
            'fields': ('hero_heading', 'hero_subtext', 'hero_bg'),
        }),
    )

    def has_add_permission(self, request):
        return not CoursePageSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Course)
class CourseAdmin(ModelAdmin):
    form          = CourseAdminForm
    list_display  = ('title', 'category', 'tier', 'duration_display', 'is_featured', 'is_active', 'order')
    list_editable = ('order', 'is_featured', 'is_active')
    list_filter   = ('category', 'tier', 'is_active', 'is_featured')
    search_fields = ('title', 'description')
    ordering      = ('order', '-created_at')
    prepopulated_fields = {'slug': ('title',)}
    fieldsets = (
        ('Course Info', {
            'fields': ('title', 'slug', 'description', 'what_youll_learn', 'thumbnail'),
        }),
        ('Classification', {
            'fields': ('category', 'tier', 'duration_display'),
        }),
        ('Videos', {
            'fields': ('trailer_video', 'course_video'),
        }),
        ('Visibility', {
            'fields': ('is_featured', 'is_active', 'order'),
        }),
    )
