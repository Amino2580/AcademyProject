from django.contrib import admin

from .models import OneTimePassword, UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = (
        "phone",
        "user",
        "role_name",
        "phone_verified_at",
        "created_at",
    )

    search_fields = (
        "phone",
        "user__username",
    )

    list_filter = (
        "user__is_staff",
        "created_at",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    @admin.display(description="Role")
    def role_name(self, obj):
        return obj.role


@admin.register(OneTimePassword)
class OneTimePasswordAdmin(admin.ModelAdmin):
    list_display = (
        "phone",
        "is_used",
        "attempts",
        "expires_at",
        "created_at",
    )

    search_fields = ("phone",)

    list_filter = (
        "is_used",
        "created_at",
    )

    readonly_fields = (
        "phone",
        "expires_at",
        "attempts",
        "is_used",
        "created_at",
    )

    fields = readonly_fields

    def has_add_permission(self, request):
        return False