from django.contrib import admin
from .models import Teacher


@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):

    list_display = (
        "first_name",
        "last_name",
        "specialty",
        "is_active",
    )

    search_fields = (
        "first_name",
        "last_name",
        "specialty",
    )

    list_filter = (
        "is_active",
    )