from datetime import (
    date,
    datetime,
    timedelta,
)

import django.db.models.deletion
from django.db import migrations, models
from django.db.models import F, Q


def add_default_end_times(apps, schema_editor):
    ClassBooking = apps.get_model(
        "schedules",
        "ClassBooking",
    )
    ClassSession = apps.get_model(
        "schedules",
        "ClassSession",
    )

    for model in (ClassBooking, ClassSession):
        for item in model.objects.filter(
            end_time__isnull=True
        ):
            item.end_time = (
                datetime.combine(
                    date.min,
                    item.start_time,
                )
                + timedelta(minutes=30)
            ).time()
            item.save(update_fields=["end_time"])


class Migration(migrations.Migration):

    dependencies = [
        (
            "schedules",
            "0006_classsession_enrollment_and_more",
        ),
    ]

    operations = [
        migrations.CreateModel(
            name="ClassOffering",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "day",
                    models.CharField(
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
                (
                    "start_time",
                    models.TimeField(db_index=True),
                ),
                (
                    "end_time",
                    models.TimeField(db_index=True),
                ),
                (
                    "class_type",
                    models.CharField(
                        choices=[
                            ("private", "کلاس خصوصی"),
                            ("group", "کلاس گروهی"),
                            ("online", "کلاس آنلاین"),
                        ],
                        db_index=True,
                        max_length=20,
                    ),
                ),
                (
                    "capacity",
                    models.PositiveSmallIntegerField(
                        default=1
                    ),
                ),
                (
                    "is_active",
                    models.BooleanField(
                        db_index=True,
                        default=True,
                    ),
                ),
                (
                    "created_at",
                    models.DateTimeField(
                        auto_now_add=True
                    ),
                ),
                (
                    "updated_at",
                    models.DateTimeField(
                        auto_now=True
                    ),
                ),
            ],
            options={
                "ordering": ["day", "start_time"],
            },
        ),
        migrations.AddField(
            model_name="classbooking",
            name="class_type",
            field=models.CharField(
                choices=[
                    ("private", "کلاس خصوصی"),
                    ("group", "کلاس گروهی"),
                    ("online", "کلاس آنلاین"),
                ],
                db_index=True,
                default="private",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="classbooking",
            name="end_time",
            field=models.TimeField(
                db_index=True,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="classbooking",
            name="offering",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=(
                    django.db.models.deletion.PROTECT
                ),
                related_name="bookings",
                to="schedules.classoffering",
            ),
        ),
        migrations.AddField(
            model_name="classsession",
            name="end_time",
            field=models.TimeField(
                db_index=True,
                null=True,
            ),
        ),
        migrations.RemoveConstraint(
            model_name="classsession",
            name="unique_class_session_slot",
        ),
        migrations.RunPython(
            add_default_end_times,
            migrations.RunPython.noop,
        ),
        migrations.AlterField(
            model_name="classbooking",
            name="end_time",
            field=models.TimeField(db_index=True),
        ),
        migrations.AlterField(
            model_name="classsession",
            name="end_time",
            field=models.TimeField(db_index=True),
        ),
        migrations.AddConstraint(
            model_name="classbooking",
            constraint=models.CheckConstraint(
                condition=Q(
                    start_time__lt=F("end_time")
                ),
                name=(
                    "class_booking_start_before_end"
                ),
            ),
        ),
        migrations.AddConstraint(
            model_name="classoffering",
            constraint=models.CheckConstraint(
                condition=Q(
                    start_time__lt=F("end_time")
                ),
                name=(
                    "class_offering_start_before_end"
                ),
            ),
        ),
        migrations.AddConstraint(
            model_name="classoffering",
            constraint=models.CheckConstraint(
                condition=Q(capacity__gte=1),
                name=(
                    "class_offering_positive_capacity"
                ),
            ),
        ),
        migrations.AddConstraint(
            model_name="classoffering",
            constraint=models.UniqueConstraint(
                fields=(
                    "day",
                    "start_time",
                    "end_time",
                    "class_type",
                ),
                name=(
                    "unique_class_offering_schedule"
                ),
            ),
        ),
    ]
