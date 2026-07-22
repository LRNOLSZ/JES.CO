from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0007_productitem_price_decimal_backfill'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='productitem',
            name='price',
        ),
        migrations.RemoveField(
            model_name='productitem',
            name='price_usd',
        ),
        migrations.RenameField(
            model_name='productitem',
            old_name='price_decimal',
            new_name='price',
        ),
        migrations.RenameField(
            model_name='productitem',
            old_name='price_usd_decimal',
            new_name='price_usd',
        ),
        migrations.AlterField(
            model_name='productitem',
            name='price',
            field=models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, help_text='Price in GHS'),
        ),
        migrations.AlterField(
            model_name='productitem',
            name='price_usd',
            field=models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, help_text='Price in USD, shown to USA-region visitors instead of the GHS price above. Leave blank to fall back to the GHS price.'),
        ),
    ]
