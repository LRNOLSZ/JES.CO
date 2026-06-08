from django.contrib import admin
from import_export.admin import ImportExportModelAdmin
from unfold.admin import ModelAdmin
from unfold.contrib.import_export.forms import ExportForm, ImportForm

from .models import BookingRequest


@admin.register(BookingRequest)
class BookingRequestAdmin(ImportExportModelAdmin, ModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm

    list_display  = ('full_name', 'email', 'phone', 'service_type', 'preferred_date', 'status', 'created_at')
    list_filter   = ('status', 'service_type')
    search_fields = ('full_name', 'email', 'phone')
    list_editable = ('status',)
    ordering      = ('-created_at',)
    readonly_fields = ('created_at',)
