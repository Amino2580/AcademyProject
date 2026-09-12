from django.db import models


class RegistrationRequest(models.Model):
    class Status(models.TextChoices):
        NEW = "new", "New"
        CONTACTED = "contacted", "Contacted"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    class PreferredDay(models.TextChoices):
        SATURDAY = "saturday", "شنبه"
        SUNDAY = "sunday", "یکشنبه"
        MONDAY = "monday", "دوشنبه"
        TUESDAY = "tuesday", "سه‌شنبه"
        WEDNESDAY = "wednesday", "چهارشنبه"
        THURSDAY = "thursday", "پنجشنبه"

    full_name = models.CharField(
        max_length=150,
    )

    phone = models.CharField(
        max_length=20,
        db_index=True,
    )

    age = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
    )

    level = models.CharField(
        max_length=50,
        blank=True,
    )

    instrument = models.CharField(
        max_length=100,
        blank=True,
    )

    class_type = models.CharField(
        max_length=100,
        blank=True,
    )

    preferred_day = models.CharField(
        max_length=10,
        choices=PreferredDay.choices,
        blank=True,
    )

    preferred_time = models.TimeField(
        null=True,
        blank=True,
    )

    message = models.TextField(
        blank=True,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.NEW,
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
            "-created_at",
        ]

    def __str__(self):
        return (
            f"{self.full_name} - "
            f"{self.phone}"
        )