from django.contrib import admin

from .models import (
    ClassBooking,
    ClassOffering,
    ClassSession,
    Enrollment,
)


@admin.register(ClassBooking)
class ClassBookingAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "student_name",
        "phone",
        "day_label",
        "start_time",
        "end_time",
        "class_type",
        "enrollment",
        "instrument",
        "updated_at",
    )

    list_filter = (
        "day",
        "start_time",
        "class_type",
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


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "student",
        "starts_on",
        "expires_on",
        "is_active",
    )

    list_filter = (
        "is_active",
        "starts_on",
        "expires_on",
    )

    search_fields = (
        "student__full_name",
        "student__phone",
    )


@admin.register(ClassOffering)
class ClassOfferingAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "class_type",
        "day",
        "start_time",
        "end_time",
        "capacity",
        "is_active",
    )

    list_filter = (
        "class_type",
        "day",
        "is_active",
    )


@admin.register(ClassSession)
class ClassSessionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "student_name",
        "date",
        "start_time",
        "end_time",
        "status",
    )

    list_filter = (
        "status",
        "date",
        "start_time",
    )

    search_fields = (
        "booking__student_name",
        "booking__phone",
    )

    ordering = (
        "date",
        "start_time",
    )

    @admin.display(
        description="هنرجو",
        ordering="booking__student_name",
    )
    def student_name(self, obj):
        return obj.booking.student_name
