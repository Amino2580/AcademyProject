import re

from rest_framework import serializers

from .models import Student


class StudentSerializer(serializers.ModelSerializer):
    name = serializers.CharField(
        source="full_name",
        max_length=150,
    )

    isActive = serializers.BooleanField(
        source="is_active",
        required=False,
    )

    createdAt = serializers.DateTimeField(
        source="created_at",
        read_only=True,
    )

    updatedAt = serializers.DateTimeField(
        source="updated_at",
        read_only=True,
    )

    class Meta:
        model = Student
        fields = (
            "id",
            "name",
            "phone",
            "age",
            "level",
            "notes",
            "isActive",
            "createdAt",
            "updatedAt",
        )

        read_only_fields = (
            "id",
            "createdAt",
            "updatedAt",
        )

        extra_kwargs = {
            "age": {
                "required": False,
                "allow_null": True,
            },
            "level": {
                "required": False,
                "allow_blank": True,
            },
            "notes": {
                "required": False,
                "allow_blank": True,
            },
        }

    def validate_phone(self, value):
        phone = value.strip().replace(" ", "").replace("-", "")

        if phone.startswith("+98"):
            phone = "0" + phone[3:]
        elif phone.startswith("98"):
            phone = "0" + phone[2:]

        if not re.fullmatch(r"09[0-9]{9}", phone):
            raise serializers.ValidationError(
                "Enter a valid Iranian mobile number."
            )

        return phone