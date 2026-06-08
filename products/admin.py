from django.contrib import admin
from django.utils.html import format_html
from import_export.admin import ImportExportModelAdmin
from unfold.admin import ModelAdmin
from unfold.contrib.import_export.forms import ExportForm, ImportForm

from .models import Order, OrderItem, ProductItem


class OrderItemInline(admin.TabularInline):
    model  = OrderItem
    extra  = 0
    fields = ('name', 'price', 'quantity')
    readonly_fields = ('name', 'price', 'quantity')


@admin.register(Order)
class OrderAdmin(ImportExportModelAdmin, ModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm

    list_display  = ('id', 'full_name', 'email', 'phone', 'total', 'status', 'created_at')
    list_filter   = ('status',)
    search_fields = ('full_name', 'email', 'phone')
    list_editable = ('status',)
    ordering      = ('-created_at',)
    readonly_fields = ('created_at',)
    inlines       = [OrderItemInline]


@admin.register(ProductItem)
class ProductItemAdmin(ModelAdmin):
    list_display  = ('thumb', 'name', 'category_badge', 'price', 'stock_badge', 'order', 'is_active', 'created_at')
    list_editable = ('order', 'is_active')
    list_filter   = ('category', 'stock_status', 'is_active')
    search_fields = ('name', 'description')
    ordering      = ('category', 'order', '-created_at')
    fields        = ('category', 'name', 'description', 'price', 'image', 'stock_status', 'order', 'is_active')

    def thumb(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="width:52px;height:52px;object-fit:cover;border-radius:6px;" />', obj.image.url)
        return '—'
    thumb.short_description = ''

    def category_badge(self, obj):
        colours = {
            'makeup':      '#60269E',
            'skincare':    '#1c6b4a',
            'collections': '#8a5a1e',
        }
        colour = colours.get(obj.category, '#555')
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 10px;border-radius:999px;font-size:0.7rem;">{}</span>',
            colour, obj.get_category_display()
        )
    category_badge.short_description = 'Category'

    def stock_badge(self, obj):
        colours = {
            'in_stock':    ('#16a34a', 'In Stock'),
            'out_of_stock':('#dc2626', 'Out of Stock'),
            'coming_soon': ('#d97706', 'Coming Soon'),
        }
        colour, label = colours.get(obj.stock_status, ('#555', obj.stock_status))
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 10px;border-radius:999px;font-size:0.7rem;">{}</span>',
            colour, label
        )
    stock_badge.short_description = 'Stock'
