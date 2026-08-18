from django.db import models
from teachers.models import Teacher


class Course(models.Model):
    title = models.CharField(max_length=100)

    teacher = models.ForeignKey(
        Teacher,
        on_delete=models.CASCADE,
        related_name="courses"
    )

    description = models.TextField(blank=True)
    price = models.PositiveIntegerField()
    is_active = models.BooleanField(default=True)

    day = models.CharField(
        max_length=20,
        null=True,
        blank=True
    )

    start_time = models.TimeField(
        null=True,
        blank=True
    )

    end_time = models.TimeField(
        null=True,
        blank=True
    )

    room = models.CharField(
        max_length=50,
        null=True,
        blank=True
    )

    def __str__(self):
        return self.title


class CourseStudent(models.Model):
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="students"
    )

    national_id = models.BigIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["course", "national_id"],
                name="unique_course_student"
            )
        ]

    def __str__(self):
        return f"{self.course.title} - {self.national_id}"