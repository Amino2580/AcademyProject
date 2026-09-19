import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        (
            "registrations",
            "0005_registrationrequest_enrollment",
        ),
        (
            "schedules",
            "0007_class_offerings_and_class_duration",
        ),
    ]

    operations = [
        migrations.AlterField(
            model_name="registrationrequest",
            name="class_type",
            field=models.CharField(
                blank=True,
                choices=[
                    ("private", "کلاس خصوصی"),
                    ("group", "کلاس گروهی"),
                    ("online", "کلاس آنلاین"),
                ],
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="registrationrequest",
            name="class_offering",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=(
                    django.db.models.deletion.SET_NULL
                ),
                related_name="registration_requests",
                to="schedules.classoffering",
            ),
        ),
        migrations.AddField(
            model_name="registrationrequest",
            name="preferred_end_time",
            field=models.TimeField(
                blank=True,
                null=True,
            ),
        ),
    ]
