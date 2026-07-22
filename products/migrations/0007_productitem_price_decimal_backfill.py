import re

from django.db import migrations, models


def backfill_price_decimals(apps, schema_editor):
    ProductItem = apps.get_model('products', 'ProductItem')
    for product in ProductItem.objects.all():
        match = re.search(r'[\d.]+', product.price or '')
        product.price_decimal = match.group(0) if match else None
        match_usd = re.search(r'[\d.]+', product.price_usd or '')
        product.price_usd_decimal = match_usd.group(0) if match_usd else None
        product.save(update_fields=['price_decimal', 'price_usd_decimal'])


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0006_productitem_price_usd'),
    ]

    operations = [
        migrations.AddField(
            model_name='productitem',
            name='price_decimal',
            field=models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True),
        ),
        migrations.AddField(
            model_name='productitem',
            name='price_usd_decimal',
            field=models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True),
        ),
        migrations.RunPython(backfill_price_decimals, noop),
    ]
