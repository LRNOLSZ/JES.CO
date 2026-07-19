from django.contrib import admin
from django.db.models import Count
from django.utils.html import format_html
from import_export.admin import ImportExportModelAdmin
from unfold.admin import ModelAdmin
from unfold.contrib.import_export.forms import ExportForm, ImportForm

from .models import DeliveryZone, Order, OrderItem, ProductItem
from .views import _send_order_email, _tracking_url


# ── Delivery Zones ─────────────────────────────────────────────────────────────

@admin.register(DeliveryZone)
class DeliveryZoneAdmin(ModelAdmin):
    list_display  = ('location_name', 'country_badge', 'price_display', 'is_active', 'order')
    list_editable = ('is_active', 'order')
    list_filter   = ('country', 'is_active')
    ordering      = ('country', 'order', 'location_name')
    fieldsets = (
        ('Ghana Delivery', {
            'fields': ('country', 'location_name', 'price', 'is_active', 'order'),
            'description': 'Set country to "Ghana" for Ghana zones, "USA" for USA zones.',
        }),
    )

    def country_badge(self, obj):
        color = '#60269E' if obj.country == 'ghana' else '#1a56db'
        label = obj.get_country_display()
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 10px;border-radius:999px;font-size:0.7rem;">{}</span>',
            color, label,
        )
    country_badge.short_description = 'Country'

    def price_display(self, obj):
        currency = 'GHS' if obj.country == 'ghana' else 'USD'
        return f'{currency} {obj.price}'
    price_display.short_description = 'Fee'
    price_display.admin_order_field = 'price'


# ── Orders ─────────────────────────────────────────────────────────────────────

class OrderItemInline(admin.TabularInline):
    model         = OrderItem
    extra         = 0
    fields        = ('name', 'price', 'quantity')
    readonly_fields = ('name', 'price', 'quantity')


STATUS_COLORS = {
    'pending':    ('#6b7280', 'Pending'),
    'confirmed':  ('#1a56db', 'Confirmed'),
    'processing': ('#d97706', 'Processing'),
    'shipped':    ('#60269E', 'Shipped'),
    'delivered':  ('#16a34a', 'Delivered'),
    'cancelled':  ('#dc2626', 'Cancelled'),
}

STATUS_EMAIL_MESSAGES = {
    'confirmed':  'Your order has been confirmed and is being prepared.',
    'processing': 'Your order is being packed and prepared for dispatch.',
    'shipped':    'Your order is on its way to you.',
    'delivered':  'Your order has been delivered. Enjoy!',
    'cancelled':  'Your order has been cancelled. Contact us if you have questions.',
}


@admin.register(Order)
class OrderAdmin(ImportExportModelAdmin, ModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm

    list_display    = ('id', 'full_name', 'email', 'phone', 'total', 'status_badge', 'delivery_zone', 'created_at')
    list_filter     = ('status',)
    list_editable   = ()
    search_fields   = ('full_name', 'email', 'phone', 'paystack_reference')
    ordering        = ('-created_at',)
    readonly_fields = ('created_at', 'paystack_reference', 'status_badge')
    inlines         = [OrderItemInline]
    list_before_template = 'admin/products/order/status_counts.html'

    fieldsets = (
        ('Customer', {
            'fields': ('full_name', 'email', 'phone', 'address', 'notes'),
        }),
        ('Order', {
            'fields': ('status', 'total', 'delivery_zone', 'delivery_fee', 'paystack_reference', 'created_at'),
        }),
    )

    def status_badge(self, obj):
        color, label = STATUS_COLORS.get(obj.status, ('#6b7280', obj.status))
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 10px;border-radius:999px;font-size:0.7rem;font-weight:600;">{}</span>',
            color, label,
        )
    status_badge.short_description = 'Status'

    def changelist_view(self, request, extra_context=None):
        counts_by_status = dict(
            Order.objects.values_list('status').annotate(count=Count('id'))
        )
        status_counts = [
            {
                'value': value,
                'label': label,
                'color': STATUS_COLORS.get(value, ('#6b7280', label))[0],
                'count': counts_by_status.get(value, 0),
            }
            for value, label in Order.STATUS_CHOICES
        ]
        extra_context = extra_context or {}
        extra_context['status_counts'] = status_counts
        return super().changelist_view(request, extra_context=extra_context)

    def save_model(self, request, obj, form, change):
        old_status = form.initial.get('status') if change else None
        super().save_model(request, obj, form, change)
        if change and old_status and old_status != obj.status and obj.status in STATUS_EMAIL_MESSAGES:
            body = (
                f'Hi {obj.full_name},\n\n'
                f'{STATUS_EMAIL_MESSAGES[obj.status]}\n\n'
                f'Order total: {obj.total}\n\n'
                f'Track your order: {_tracking_url(obj)}\n\n'
                f'-- The JES.CO Team'
            )
            _send_order_email(obj.email, f'Your JES.CO Order #{obj.pk} — {obj.get_status_display()}', body)


# ── Products ───────────────────────────────────────────────────────────────────

@admin.register(ProductItem)
class ProductItemAdmin(ModelAdmin):
    list_display  = ('thumb', 'name', 'category_badge', 'price', 'price_usd', 'stock_badge', 'quantity', 'order', 'is_active', 'created_at')
    list_editable = ('quantity', 'order', 'is_active')
    list_filter   = ('category', 'stock_status', 'is_active')
    search_fields = ('name', 'description')
    ordering      = ('category', 'order', '-created_at')
    fields        = ('category', 'name', 'description', 'price', 'price_usd', 'image', 'stock_status', 'quantity', 'order', 'is_active')

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
