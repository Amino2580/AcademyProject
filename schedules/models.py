from datetime import (
    date,
    datetime,
    timedelta,
)

from django.db import models
from django.db.models import F, Q

from students.models import Student


def default_end_time(start_time):
    if start_time is None:
        return None

    return (
        datetime.combine(date.min, start_time)
        + timedelta(minutes=30)
    ).time()


class Enrollment(models.Model):
    student = models.ForeignKey(
        Student,
        on_delete=models.PROTECT,
        related_name="enrollments",
    )

    starts_on = models.DateField(
        db_index=True,
    )

    expires_on = models.DateField(
        db_index=True,
    )

    is_active = models.BooleanField(
        default=True,
        db_index=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = [
            "-starts_on",
            "-created_at",
        ]

        constraints = [
            models.CheckConstraint(
                condition=Q(
                    starts_on__lt=F(
                        "expires_on"
                    )
                ),
                name=(
                    "enrollment_starts_before_"
                    "expiration"
                ),
            ),
        ]

    def __str__(self):
        return (
            f"{self.student.full_name} - "
            f"{self.starts_on} تا "
            f"{self.expires_on}"
        )


class ClassBooking(models.Model):
    class Weekday(models.TextChoices):
        SATURDAY = "saturday", "شنبه"
        SUNDAY = "sunday", "یکشنبه"
        MONDAY = "monday", "دوشنبه"
        TUESDAY = "tuesday", "سه‌شنبه"
        WEDNESDAY = "wednesday", "چهارشنبه"
        THURSDAY = "thursday", "پنجشنبه"
        FRIDAY = "friday", "جمعه"

    class ClassType(models.TextChoices):
        PRIVATE = "private", "کلاس خصوصی"
        GROUP = "group", "کلاس گروهی"
        ONLINE = "online", "کلاس آنلاین"

    day = models.CharField(
        max_length=10,
        choices=Weekday.choices,
        db_index=True,
    )

    start_time = models.TimeField(
        db_index=True,
    )

    end_time = models.TimeField(
        db_index=True,
    )

    class_type = models.CharField(
        max_length=20,
        choices=ClassType.choices,
        default=ClassType.PRIVATE,
        db_index=True,
    )

    offering = models.ForeignKey(
        "ClassOffering",
        on_delete=models.PROTECT,
        related_name="bookings",
        null=True,
        blank=True,
    )

    student = models.ForeignKey(
        Student,
        on_delete=models.SET_NULL,
        related_name="class_bookings",
        null=True,
        blank=True,
    )

    enrollment = models.ForeignKey(
        Enrollment,
        on_delete=models.CASCADE,
        related_name="weekly_bookings",
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
            models.CheckConstraint(
                condition=Q(
                    start_time__lt=F("end_time")
                ),
                name=(
                    "class_booking_start_before_end"
                ),
            ),
        ]

    def __str__(self):
        return (
            f"{self.get_day_display()} "
            f"{self.start_time:%H:%M} تا "
            f"{self.end_time:%H:%M} - "
            f"{self.student_name}"
        )

    def save(self, *args, **kwargs):
        if self.end_time is None:
            self.end_time = default_end_time(
                self.start_time
            )

        super().save(*args, **kwargs)


class ClassOffering(models.Model):
    day = models.CharField(
        max_length=10,
        choices=ClassBooking.Weekday.choices,
        db_index=True,
    )

    start_time = models.TimeField(
        db_index=True,
    )

    end_time = models.TimeField(
        db_index=True,
    )

    class_type = models.CharField(
        max_length=20,
        choices=ClassBooking.ClassType.choices,
        db_index=True,
    )

    capacity = models.PositiveSmallIntegerField(
        default=1,
    )

    is_active = models.BooleanField(
        default=True,
        db_index=True,
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
            models.CheckConstraint(
                condition=Q(
                    start_time__lt=F("end_time")
                ),
                name=(
                    "class_offering_start_before_end"
                ),
            ),
            models.CheckConstraint(
                condition=Q(capacity__gte=1),
                name=(
                    "class_offering_positive_capacity"
                ),
            ),
            models.UniqueConstraint(
                fields=[
                    "day",
                    "start_time",
                    "end_time",
                    "class_type",
                ],
                name=(
                    "unique_class_offering_schedule"
                ),
            ),
        ]

    def __str__(self):
        return (
            f"{self.get_class_type_display()} - "
            f"{self.get_day_display()} "
            f"{self.start_time:%H:%M} تا "
            f"{self.end_time:%H:%M}"
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


class ClassSession(models.Model):
    class Status(models.TextChoices):
        SCHEDULED = (
            "scheduled",
            "برگزار می‌شود",
        )
        CANCELLED = (
            "cancelled",
            "لغو شده",
        )
        COMPLETED = (
            "completed",
            "برگزار شده",
        )

    booking = models.ForeignKey(
        ClassBooking,
        on_delete=models.CASCADE,
        related_name="sessions",
    )

    date = models.DateField(
        db_index=True,
    )

    start_time = models.TimeField(
        db_index=True,
    )

    end_time = models.TimeField(
        db_index=True,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.SCHEDULED,
        db_index=True,
    )

    cancellation_reason = models.CharField(
        max_length=200,
        blank=True,
    )

    availability_exception = (
        models.ForeignKey(
            AvailabilityException,
            on_delete=models.SET_NULL,
            related_name="cancelled_sessions",
            null=True,
            blank=True,
        )
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
            models.UniqueConstraint(
                fields=[
                    "booking",
                    "date",
                ],
                name=(
                    "unique_booking_session_date"
                ),
            ),
        ]

    def __str__(self):
        return (
            f"{self.date} "
            f"{self.start_time:%H:%M} تا "
            f"{self.end_time:%H:%M} - "
            f"{self.booking.student_name}"
        )

    def save(self, *args, **kwargs):
        if self.end_time is None:
            self.end_time = default_end_time(
                self.start_time
            )

        super().save(*args, **kwargs)
