from django.db import migrations
from django.db.models import Count


def backfill_group_booking_offerings(
    apps,
    schema_editor,
):
    ClassBooking = apps.get_model(
        "schedules",
        "ClassBooking",
    )
    ClassOffering = apps.get_model(
        "schedules",
        "ClassOffering",
    )

    database = schema_editor.connection.alias

    booking_groups = (
        ClassBooking.objects.using(database)
        .filter(
            class_type="group",
            offering__isnull=True,
        )
        .values(
            "day",
            "start_time",
            "end_time",
        )
        .annotate(student_count=Count("id"))
    )

    for booking_group in booking_groups:
        offering = (
            ClassOffering.objects.using(database)
            .filter(
                day=booking_group["day"],
                start_time=(
                    booking_group["start_time"]
                ),
                end_time=booking_group["end_time"],
                class_type="group",
            )
            .first()
        )

        minimum_capacity = max(
            2,
            booking_group["student_count"],
        )

        if offering is None:
            offering = (
                ClassOffering.objects.using(database)
                .create(
                    day=booking_group["day"],
                    start_time=(
                        booking_group["start_time"]
                    ),
                    end_time=booking_group["end_time"],
                    class_type="group",
                    capacity=minimum_capacity,
                    is_active=True,
                )
            )
        elif offering.capacity < minimum_capacity:
            offering.capacity = minimum_capacity
            offering.save(
                update_fields=[
                    "capacity",
                    "updated_at",
                ]
            )

        (
            ClassBooking.objects.using(database)
            .filter(
                class_type="group",
                offering__isnull=True,
                day=booking_group["day"],
                start_time=(
                    booking_group["start_time"]
                ),
                end_time=booking_group["end_time"],
            )
            .update(offering_id=offering.id)
        )


class Migration(migrations.Migration):

    dependencies = [
        (
            "schedules",
            "0007_class_offerings_and_class_duration",
        ),
    ]

    operations = [
        migrations.RunPython(
            backfill_group_booking_offerings,
            migrations.RunPython.noop,
        ),
    ]
