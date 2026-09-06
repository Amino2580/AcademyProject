from django.contrib import admin

from .models import Student


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "full_name",
        "phone",
        "age",
        "level",
        "is_active",
        "created_at",
    )

    list_filter = (
        "is_active",
        "level",
        "created_at",
    )

    search_fields = (
        "full_name",
        "phone",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    ordering = ("-created_at",)
    list_per_page = 25