from django.db import models
from django.db.models import F, Q

from students.models import Student


class ClassBooking(models.Model):
    class Weekday(models.TextChoices):
        SATURDAY = "saturday", "شنبه"
        SUNDAY = "sunday", "یکشنبه"
        MONDAY = "monday", "دوشنبه"
        TUESDAY = "tuesday", "سه‌شنبه"
        WEDNESDAY = "wednesday", "چهارشنبه"
        THURSDAY = "thursday", "پنجشنبه"
        FRIDAY = "friday", "جمعه"

    day = models.CharField(
        max_length=10,
        choices=Weekday.choices,
        db_index=True,
    )

    start_time = models.TimeField(
        db_index=True,
    )

    student = models.ForeignKey(
        Student,
        on_delete=models.SET_NULL,
        related_name="class_bookings",
        null=True,
        blank=True,
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
                name=(
                    "unique_class_booking_slot"
                ),
            ),
        ]

    def __str__(self):
        return (
            f"{self.get_day_display()} "
            f"{self.start_time:%H:%M} - "
            f"{self.student_name}"
        )


class WeeklyAvailability(models.Model):
    day = models.CharField(
        max_length=10,
        choices=ClassBooking.Weekday.choices,
        db_index=True,
    )

    start_time = models.TimeField()

    end_time = models.TimeField()

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
            models.CheckConstraint(
                condition=Q(
                    start_time__lt=F(
                        "end_time"
                    )
                ),
                name=(
                    "weekly_availability_"
                    "start_before_end"
                ),
            ),
            models.UniqueConstraint(
                fields=[
                    "day",
                    "start_time",
                    "end_time",
                ],
                name=(
                    "unique_weekly_"
                    "availability_range"
                ),
            ),
        ]

    def __str__(self):
        return (
            f"{self.get_day_display()} "
            f"{self.start_time:%H:%M} تا "
            f"{self.end_time:%H:%M}"
        )


class AvailabilityException(models.Model):
    date = models.DateField(
        db_index=True,
    )

    start_time = models.TimeField(
        null=True,
        blank=True,
    )

    end_time = models.TimeField(
        null=True,
        blank=True,
    )

    reason = models.CharField(
        max_length=200,
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
            "date",
            "start_time",
        ]

        constraints = [
            models.CheckConstraint(
                condition=(
                    (
                        Q(
                            start_time__isnull=True
                        )
                        & Q(
                            end_time__isnull=True
                        )
                    )
                    | (
                        Q(
                            start_time__isnull=False
                        )
                        & Q(
                            end_time__isnull=False
                        )
                        & Q(
                            start_time__lt=F(
                                "end_time"
                            )
                        )
                    )
                ),
                name=(
                    "availability_exception_"
                    "valid_time_range"
                ),
            ),
            models.UniqueConstraint(
                fields=[
                    "date",
                ],
                condition=(
                    Q(
                        start_time__isnull=True
                    )
                    & Q(
                        end_time__isnull=True
                    )
                ),
                name=(
                    "unique_full_day_"
                    "availability_exception"
                ),
            ),
            models.UniqueConstraint(
                fields=[
                    "date",
                    "start_time",
                    "end_time",
                ],
                condition=(
                    Q(
                        start_time__isnull=False
                    )
                    & Q(
                        end_time__isnull=False
                    )
                ),
                name=(
                    "unique_timed_"
                    "availability_exception"
                ),
            ),
        ]

    @property
    def is_full_day(self):
        return (
            self.start_time is None
            and self.end_time is None
        )

    def __str__(self):
        if self.is_full_day:
            return (
                f"{self.date} - تمام روز"
            )

        return (
            f"{self.date} "
            f"{self.start_time:%H:%M} تا "
            f"{self.end_time:%H:%M}"
        )