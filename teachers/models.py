from django.db import models


class Teacher(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    specialty = models.CharField(max_length=100)
    bio = models.TextField(blank=True)
    instagram = models.CharField(max_length=100, blank=True)
    telegram = models.URLField(blank=True)
    email = models.EmailField(blank=True)
    photo = models.ImageField(
        upload_to="teachers/",
        blank=True,
        null=True
    )
    is_active = models.BooleanField(default=True)
    

    def __str__(self):
        return f"{self.first_name} {self.last_name}"