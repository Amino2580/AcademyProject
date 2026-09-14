from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        (
            "schedules",
            "0004_seed_default_weekly_availability",
        ),
    ]

    operations = [
        migrations.AlterField(
            model_name="classbooking",
            name="day",
            field=models.CharField(
                choices=[
                    ("saturday", "شنبه"),
                    ("sunday", "یکشنبه"),
                    ("monday", "دوشنبه"),
                    ("tuesday", "سه‌شنبه"),
                    ("wednesday", "چهارشنبه"),
                    ("thursday", "پنجشنبه"),
                    ("friday", "جمعه"),
                ],
                db_index=True,
                max_length=10,
            ),
        ),
        migrations.AlterField(
            model_name="weeklyavailability",
            name="day",
            field=models.CharField(
                choices=[
                    ("saturday", "شنبه"),
                    ("sunday", "یکشنبه"),
                    ("monday", "دوشنبه"),
                    ("tuesday", "سه‌شنبه"),
                    ("wednesday", "چهارشنبه"),
                    ("thursday", "پنجشنبه"),
                    ("friday", "جمعه"),
                ],
                db_index=True,
                max_length=10,
            ),
        ),
    ]
