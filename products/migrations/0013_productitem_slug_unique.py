# Step 3 of 3 for ProductItem.slug — see the header comment in
# 0012_productitem_slug_productimage.py for the full reasoning.
#
# This applies the unique constraint, now that 0012 has added the column and
# backfilled a distinct slug onto every existing row. It is a separate migration
# because doing AddField + AlterField(unique=True) together fails on Postgres:
# both derive the same name for the varchar_pattern_ops index and the second
# create collides with the first inside one transaction.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0012_productitem_slug_productimage'),
    ]

    operations = [
        migrations.AlterField(
            model_name='productitem',
            name='slug',
            field=models.SlugField(
                blank=True,
                help_text="URL for this product's own page, e.g. /product/velvet-wrap-dress. "
                          "Generated from the name automatically — leave blank.",
                max_length=220,
                unique=True,
            ),
        ),
    ]
