from django.contrib import admin
from django.db.models import Count
from django.utils.html import format_html
from import_export.admin import ImportExportModelAdmin
from unfold.admin import ModelAdmin, TabularInline
from unfold.contrib.import_export.forms import ExportForm, ImportForm
from unfold.decorators import display

from core.admin import action_button, person_display, url_preview
from jesrestudio_backend.email_backends import send_branded_email

from .models import DeliveryZone, DigitalEntitlement, Order, OrderItem, ProductItem
from .views import _account_url, _tracking_url


# ── Delivery Zones ─────────────────────────────────────────────────────────────

@admin.register(DeliveryZone)
class DeliveryZoneAdmin(ModelAdmin):
    list_display  = ('location_name', 'country_badge', 'price_display', 'is_active', 'order')
    list_editable = ('is_active', 'order')
    list_filter   = ('country', 'is_active')
    ordering      = ('country', 'order', 'location_name')
    fieldsets = (
        ('Delivery Zone Details', {
            'fields': ('country', 'location_name', 'price', 'is_active', 'order'),
            'description': 'Set country to "Ghana" for Ghana zones, "USA" for USA zones.',
        }),
    )

    @display(description='Country', label={'ghana': 'primary', 'usa': 'info'})
    def country_badge(self, obj):
        return obj.country, obj.get_country_display()

    def price_display(self, obj):
        currency = 'GHS' if obj.country == 'ghana' else 'USD'
        return f'{currency} {obj.price}'
    price_display.short_description = 'Fee'
    price_display.admin_order_field = 'price'


# ── Orders ─────────────────────────────────────────────────────────────────────

class OrderItemInline(TabularInline):
    model         = OrderItem
    extra         = 0
    tab           = True
    fields        = ('name', 'price', 'quantity')
    readonly_fields = ('name', 'price', 'quantity')


STATUS_COLORS = {
    # Still used by changelist_view() below for the status-counts summary bar
    # (a separate custom template, out of scope for this badge-pill pass — see
    # the admin_dashboard_aesthetic_overhaul memory). status_badge() itself no
    # longer reads this dict; it uses Unfold's native @display(label=...)
    # instead. Kept in sync with the corrected brand palette regardless.
    'pending':    ('#6b7280', 'Pending'),
    'confirmed':  ('#1a56db', 'Confirmed'),
    'processing': ('#d97706', 'Processing'),
    'shipped':    ('#A8864A', 'Shipped'),
    'delivered':  ('#16a34a', 'Delivered'),
    'cancelled':  ('#dc2626', 'Cancelled'),
}

STATUS_EMAIL_TITLES = {
    'confirmed':  'Your Order is Confirmed',
    'processing': 'Your Order is Being Prepared',
    'shipped':    'Your Order is Shipped',
    'delivered':  'Your Order Has Been Delivered',
    'cancelled':  'Your Order Has Been Cancelled',
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
    compressed_fields = True

    fieldsets = (
        ('Customer', {
            'fields': ('full_name', 'email', 'phone', 'address', 'notes'),
            'classes': ('tab',),
        }),
        ('Order', {
            'fields': ('status', 'total', 'delivery_zone', 'delivery_fee', 'paystack_reference', 'created_at'),
            'classes': ('tab',),
        }),
    )

    @display(description='Status', label={
        'confirmed': 'info', 'processing': 'warning', 'shipped': 'primary',
        'delivered': 'success', 'cancelled': 'danger',
    })
    def status_badge(self, obj):
        return obj.status, obj.get_status_display()

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
            send_branded_email(
                obj.email,
                title=STATUS_EMAIL_TITLES[obj.status],
                first_name=obj.full_name,
                message=STATUS_EMAIL_MESSAGES[obj.status],
                details=[
                    ('Order #', f'#{obj.pk}'),
                    ('Total', obj.total),
                ],
                cta_url=_tracking_url(obj),
                cta_label='Track Your Order',
            )


# ── Products ───────────────────────────────────────────────────────────────────

@admin.register(ProductItem)
class ProductItemAdmin(ModelAdmin):
    # `quantity` stays inline-editable: physical stock management is the daily
    # workflow and list_editable can't be made conditional per row. On a digital
    # row the value is simply ignored by ProductItem.save().
    list_display  = ('thumb', 'name', 'category_badge', 'type_badge', 'price_display', 'price_usd_display', 'stock_badge', 'quantity', 'order', 'is_active', 'created_at')
    list_editable = ('quantity', 'order', 'is_active')
    list_filter   = ('product_type', 'category', 'stock_status', 'is_active')
    search_fields = ('name', 'description')
    ordering      = ('category', 'order', '-created_at')
    readonly_fields = ('image_preview',)
    fieldsets = (
        ('Basic Info', {
            'fields': ('category', 'product_type', 'name', 'description', 'image', 'image_preview'),
            'description': 'Set Type to "Digital" for downloadable products (PDF guides). '
                           'Digital items need no delivery, address or stock.',
        }),
        ('Digital File', {
            'fields': ('digital_file',),
            'description': 'PDF only, and required for digital products. Stored privately — '
                           'buyers only ever get a short-lived signed link from their account '
                           'page, never a public URL, so the file cannot be shared permanently. '
                           'Replacing this file updates it for everyone who has already bought it.',
        }),
        ('Pricing', {
            'fields': ('price', 'price_usd'),
            'description': 'Digital products use the GHS price only — the same price applies '
                           'everywhere, with a USD figure shown alongside for information. '
                           'Price (USD) is for physical items sold to USA customers.',
        }),
        ('Inventory & Visibility', {
            'fields': ('stock_status', 'quantity', 'order', 'is_active'),
            'description': 'Stock applies to physical items only. Digital products never run out, '
                           'and their stock fields are ignored.',
        }),
    )

    def get_readonly_fields(self, request, obj=None):
        # Stock is meaningless for a digital product — show it, but don't invite
        # edits that will simply be ignored by ProductItem.save().
        ro = list(super().get_readonly_fields(request, obj))
        if obj and obj.is_digital:
            ro += ['stock_status', 'quantity']
        return ro

    def image_preview(self, obj):
        return url_preview(obj.image)
    image_preview.short_description = 'Current'

    def thumb(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="width:52px;height:52px;object-fit:cover;border-radius:6px;" />', obj.image.url)
        return '—'
    thumb.short_description = ''

    def price_display(self, obj):
        return f'GHS {obj.price:.2f}' if obj.price is not None else '—'
    price_display.short_description = 'Price'
    price_display.admin_order_field = 'price'

    def price_usd_display(self, obj):
        return f'USD {obj.price_usd:.2f}' if obj.price_usd is not None else '—'
    price_usd_display.short_description = 'Price (USD)'
    price_usd_display.admin_order_field = 'price_usd'

    @display(description='Category', label={
        'makeup': 'primary', 'skincare': 'success', 'collections': 'warning',
    })
    def category_badge(self, obj):
        return obj.category, obj.get_category_display()

    @display(description='Type', label={'physical': 'info', 'digital': 'primary'})
    def type_badge(self, obj):
        return obj.product_type, obj.get_product_type_display()

    @display(description='Stock', label={
        'in_stock': 'success', 'out_of_stock': 'danger', 'coming_soon': 'warning',
    })
    def stock_badge(self, obj):
        # Digital products never run out; showing a stock pill for them would be
        # misleading. Falls through to Unfold's neutral grey (no dict entry).
        if obj.is_digital:
            return 'digital', 'Always available'
        return obj.stock_status, obj.get_stock_status_display()


# ── Digital Entitlements ───────────────────────────────────────────────────────

@admin.register(DigitalEntitlement)
class DigitalEntitlementAdmin(ModelAdmin):
    """Who owns which digital product. Permanent by design — revoke with the
    `is_active` flag (e.g. after a refund) rather than deleting the record, so
    the history of what was granted stays intact."""

    list_display  = ('customer', 'product', 'source', 'granted_at', 'is_active')
    list_filter   = ('is_active', 'product')
    search_fields = ('email', 'product__name')
    ordering      = ('-granted_at',)
    autocomplete_fields = ('product',)
    readonly_fields = ('granted_at', 'grant_link')
    compressed_fields = True

    fieldsets = (
        ('Access', {
            'fields': ('email', 'product', 'is_active'),
            'description': 'To gift a product, add a row here with the customer\'s email and '
                           'leave Order blank — they can then reach it from their account page '
                           'immediately, no payment needed.',
        }),
        ('Origin', {
            'fields': ('order', 'granted_at', 'grant_link'),
        }),
    )

    @display(description='Customer', ordering='email')
    def customer(self, obj):
        return person_display(obj.email)

    @display(description='Source')
    def source(self, obj):
        return f'Order #{obj.order.pk}' if obj.order else 'Gifted / manual'

    @display(description='Account page')
    def grant_link(self, obj):
        return action_button(_account_url(), 'Open customer account page')
