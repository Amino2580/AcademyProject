from django.contrib import admin

from .models import ClassBooking


@admin.register(ClassBooking)
class ClassBookingAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "student_name",
        "phone",
        "day_label",
        "start_time",
        "instrument",
        "updated_at",
    )

    list_filter = (
        "day",
        "start_time",
        "created_at",
    )

    search_fields = (
        "student_name",
        "phone",
        "instrument",
        "notes",
    )

    ordering = (
        "day",
        "start_time",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    @admin.display(
        description="روز",
        ordering="day",
    )
    def day_label(self, obj):
        return obj.get_day_display()