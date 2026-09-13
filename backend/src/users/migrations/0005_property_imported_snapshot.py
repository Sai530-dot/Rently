from django.db import migrations, models


def initialize_imported_listing_statuses(apps, schema_editor):
    Property = apps.get_model('users', 'Property')
    Property.objects.filter(owner__isnull=True).update(listing_status='unknown')
    Property.objects.filter(owner__isnull=False).update(listing_status='active')
    for property_record in Property.objects.exclude(image='').filter(images=[]):
        if property_record.image.startswith(('http://', 'https://')):
            property_record.images = [property_record.image]
            property_record.save(update_fields=['images'])


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0004_customuser_company_roommateprofile_bio_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='property',
            name='images',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='property',
            name='square_feet',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='property',
            name='parking',
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name='property',
            name='pets',
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name='property',
            name='utilities',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='property',
            name='appliances',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='property',
            name='features',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='property',
            name='lease_term',
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name='property',
            name='available_date',
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name='property',
            name='source_listing_id',
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name='property',
            name='listing_status',
            field=models.CharField(choices=[('active', 'Active at source'), ('unavailable', 'Unavailable at source'), ('unknown', 'Source availability unknown')], default='unknown', max_length=20),
        ),
        migrations.AddField(
            model_name='property',
            name='last_checked',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.RunPython(initialize_imported_listing_statuses, migrations.RunPython.noop),
    ]
