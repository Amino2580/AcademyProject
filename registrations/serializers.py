import re

from rest_framework import serializers

from .models import RegistrationRequest


class RegistrationRequestCreateSerializer(serializers.ModelSerializer):
    fullName = serializers.CharField(
        source="full_name",
        max_length=150,
    )

    classType = serializers.CharField(
        source="class_type",
        max_length=100,
        required=False,
        allow_blank=True,
    )

    createdAt = serializers.DateTimeField(
        source="created_at",
        read_only=True,
    )

    class Meta:
        model = RegistrationRequest
        fields = (
            "id",
            "fullName",
            "phone",
            "age",
            "level",
            "instrument",
            "classType",
            "message",
            "createdAt",
        )

        read_only_fields = (
            "id",
            "createdAt",
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
            "instrument": {
                "required": False,
                "allow_blank": True,
            },
            "message": {
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