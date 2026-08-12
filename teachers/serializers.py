from rest_framework import serializers
from .models import Teacher


class TeacherSerializer(serializers.ModelSerializer):

    def validate_first_name(self, value):
        if not value.strip():
            raise serializers.ValidationError(
                "نام استاد نمی‌تواند خالی باشد."
            )

        return value.strip()

    def validate_last_name(self, value):
        if not value.strip():
            raise serializers.ValidationError(
                "نام خانوادگی استاد نمی‌تواند خالی باشد."
            )

        return value.strip()

    def validate_specialty(self, value):
        if not value.strip():
            raise serializers.ValidationError(
                "ساز تخصصی باید مشخص شود."
            )

        return value.strip()

    class Meta:
        model = Teacher
        fields = [
            "id",
            "first_name",
            "last_name",
            "specialty",
            "bio",
            "instagram",
            "telegram",
            "email",
            "photo",
        ]