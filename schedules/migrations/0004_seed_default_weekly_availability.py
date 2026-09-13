from datetime import time

from django.db import migrations


DAYS = (
    "saturday",
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
)


def create_default_availability(
    apps,
    schema_editor,
):
    WeeklyAvailability = apps.get_model(
        "schedules",
        "WeeklyAvailability",
    )

    for day in DAYS:
        WeeklyAvailability.objects.get_or_create(
            day=day,
            start_time=time(7, 0),
            end_time=time(19, 30),
        )


def remove_default_availability(
    apps,
    schema_editor,
):
    WeeklyAvailability = apps.get_model(
        "schedules",
        "WeeklyAvailability",
    )

    WeeklyAvailability.objects.filter(
        day__in=DAYS,
        start_time=time(7, 0),
        end_time=time(19, 30),
    ).delete()


class Migration(migrations.Migration):
    dependencies = [
        (
            "schedules",
            (
                "0003_availabilityexception_"
                "weeklyavailability"
            ),
        ),
    ]

    operations = [
        migrations.RunPython(
            create_default_availability,
            remove_default_availability,
        ),
    ]