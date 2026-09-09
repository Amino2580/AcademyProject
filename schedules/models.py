from django.db import models


class ClassBooking(models.Model):
    class Weekday(models.TextChoices):
        SATURDAY = "saturday", "شنبه"
        SUNDAY = "sunday", "یکشنبه"
        MONDAY = "monday", "دوشنبه"
        TUESDAY = "tuesday", "سه‌شنبه"
        WEDNESDAY = "wednesday", "چهارشنبه"
        THURSDAY = "thursday", "پنجشنبه"

    day = models.CharField(
        max_length=10,
        choices=Weekday.choices,
        db_index=True,
    )

    start_time = models.TimeField(
        db_index=True,
    )

    student_name = models.CharField(
        max_length=150,
    )

    phone = models.CharField(
        max_length=20,
        db_index=True,
    )

    instrument = models.CharField(
        max_length=100,
        blank=True,
    )

    notes = models.TextField(
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = [
            "day",
            "start_time",
        ]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "day",
                    "start_time",
                ],
                name="unique_class_booking_slot",
            ),
        ]

    def __str__(self):
        return (
            f"{self.get_day_display()} "
            f"{self.start_time:%H:%M} - "
            f"{self.student_name}"
        )