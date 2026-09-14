from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        (
            "registrations",
            "0003_registrationrequest_preferred_date",
        ),
    ]

    operations = [
        migrations.AlterField(
            model_name="registrationrequest",
            name="preferred_day",
            field=models.CharField(
                blank=True,
                choices=[
                    ("saturday", "شنبه"),
                    ("sunday", "یکشنبه"),
                    ("monday", "دوشنبه"),
                    ("tuesday", "سه‌شنبه"),
                    ("wednesday", "چهارشنبه"),
                    ("thursday", "پنجشنبه"),
                    ("friday", "جمعه"),
                ],
                max_length=10,
            ),
        ),
    ]
