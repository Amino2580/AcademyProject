from django.db import models


class Student(models.Model):
    class Level(models.TextChoices):
        BEGINNER = "beginner", "مبتدی"
        INTERMEDIATE = "intermediate", "متوسط"
        ADVANCED = "advanced", "پیشرفته"

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
        max_length=20,
        choices=Level.choices,
        blank=True,
    )

    notes = models.TextField(
        blank=True,
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
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.full_name} - {self.phone}"