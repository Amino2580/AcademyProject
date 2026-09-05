from django.contrib import admin

from .models import RegistrationRequest


@admin.register(RegistrationRequest)
class RegistrationRequestAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "full_name",
        "phone",
        "instrument",
        "class_type",
        "status",
        "created_at",
    )

    list_filter = (
        "status",
        "level",
        "instrument",
        "class_type",
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