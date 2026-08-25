from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from unfold.admin import ModelAdmin
from unfold.decorators import display
from unfold.forms import AdminPasswordChangeForm, UserChangeForm, UserCreationForm

from core.admin import person_display

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin, ModelAdmin):
    form                  = UserChangeForm
    add_form              = UserCreationForm
    change_password_form  = AdminPasswordChangeForm

    list_display  = ('username_display', 'is_staff', 'is_active')
    list_filter   = ('is_staff', 'is_active', 'is_superuser')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering      = ('-date_joined',)

    @display(description='Username', ordering='username')
    def username_display(self, obj):
        full_name = obj.get_full_name()
        subtitle = obj.email if not full_name else f'{obj.email} — {full_name}'
        return person_display(obj.username, subtitle=subtitle or None)
