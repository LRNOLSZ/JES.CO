from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from unfold.admin import ModelAdmin
from unfold.forms import AdminPasswordChangeForm, UserChangeForm, UserCreationForm

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin, ModelAdmin):
    form = UserChangeForm
    add_form = UserCreationForm
    change_password_form = AdminPasswordChangeForm

    list_display = (
        'username', 'email', 'first_name', 'last_name',
        'subscription_tier', 'expiry_date', 'is_staff', 'is_active',
    )
    list_filter = ('subscription_tier', 'is_staff', 'is_active', 'is_superuser')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('-date_joined',)

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Subscription', {
            'fields': ('subscription_tier', 'expiry_date'),
        }),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Subscription', {
            'fields': ('subscription_tier', 'expiry_date'),
        }),
    )
