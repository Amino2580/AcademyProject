from rest_framework import serializers
from .models import Course


class CourseSerializer(serializers.ModelSerializer):

    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError(
                "عنوان کلاس نمی‌تواند خالی باشد."
            )

        return value.strip()

    class Meta:
        model = Course
        fields = [
            "id",
            "title",
            "teacher",
            "description",
            "price",
            "is_active",
        ]