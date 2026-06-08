from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from unfold.admin import ModelAdmin
from unfold.forms import AdminPasswordChangeForm, UserChangeForm, UserCreationForm

from .models import MagicLinkToken, User, UserSession


@admin.register(User)
class UserAdmin(BaseUserAdmin, ModelAdmin):
    form                  = UserChangeForm
    add_form              = UserCreationForm
    change_password_form  = AdminPasswordChangeForm

    list_display  = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'is_active')
    list_filter   = ('is_staff', 'is_active', 'is_superuser')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering      = ('-date_joined',)


@admin.register(MagicLinkToken)
class MagicLinkTokenAdmin(ModelAdmin):
    list_display    = ('user', 'created_at', 'expires_at', 'is_used')
    list_filter     = ('is_used',)
    search_fields   = ('user__email',)
    readonly_fields = ('token', 'created_at', 'expires_at')
    ordering        = ('-created_at',)


@admin.register(UserSession)
class UserSessionAdmin(ModelAdmin):
    list_display    = ('user', 'created_at', 'last_used', 'device_hint')
    search_fields   = ('user__email',)
    readonly_fields = ('created_at', 'last_used')
    ordering        = ('-last_used',)
