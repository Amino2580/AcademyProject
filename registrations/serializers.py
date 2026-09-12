import re

from django.db import transaction
from rest_framework import serializers

from schedules.models import ClassBooking
from students.models import Student

from .models import RegistrationRequest


class RegistrationRequestCreateSerializer(
    serializers.ModelSerializer
):
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

    preferredDay = serializers.ChoiceField(
        source="preferred_day",
        choices=(
            RegistrationRequest
            .PreferredDay
            .choices
        ),
        required=False,
        allow_blank=True,
    )

    preferredTime = serializers.TimeField(
        source="preferred_time",
        format="%H:%M",
        input_formats=[
            "%H:%M",
            "%H:%M:%S",
        ],
        required=False,
        allow_null=True,
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
            "preferredDay",
            "preferredTime",
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
        phone = (
            value
            .strip()
            .replace(" ", "")
            .replace("-", "")
        )

        if phone.startswith("+98"):
            phone = "0" + phone[3:]
        elif phone.startswith("98"):
            phone = "0" + phone[2:]

        if not re.fullmatch(
            r"09[0-9]{9}",
            phone,
        ):
            raise serializers.ValidationError(
                "Enter a valid Iranian "
                "mobile number."
            )

        return phone

    def validate_preferredTime(
        self,
        value,
    ):
        if value is None:
            return value

        is_valid_slot = (
            (
                7 <= value.hour < 19
                and value.minute in (0, 30)
            )
            or (
                value.hour == 19
                and value.minute == 0
            )
        )

        if (
            not is_valid_slot
            or value.second != 0
            or value.microsecond != 0
        ):
            raise serializers.ValidationError(
                "Time must be between 07:00 and "
                "19:00 in 30-minute intervals."
            )

        return value

    def validate(self, attrs):
        preferred_day = attrs.get(
            "preferred_day",
            "",
        )

        preferred_time = attrs.get(
            "preferred_time"
        )

        has_day = bool(
            preferred_day
        )

        has_time = (
            preferred_time is not None
        )

        if has_day != has_time:
            raise serializers.ValidationError(
                "Preferred day and time must "
                "be selected together."
            )

        if (
            has_day
            and ClassBooking.objects.filter(
                day=preferred_day,
                start_time=preferred_time,
            ).exists()
        ):
            raise serializers.ValidationError(
                {
                    "preferredTime": (
                        "This time slot is "
                        "no longer available."
                    )
                }
            )

        return attrs


class RegistrationRequestAdminSerializer(
    serializers.ModelSerializer
):
    fullName = serializers.CharField(
        source="full_name",
        read_only=True,
    )

    classType = serializers.CharField(
        source="class_type",
        read_only=True,
    )

    preferredDay = serializers.CharField(
        source="preferred_day",
        read_only=True,
    )

    preferredDayLabel = serializers.CharField(
        source="get_preferred_day_display",
        read_only=True,
    )

    preferredTime = serializers.TimeField(
        source="preferred_time",
        format="%H:%M",
        read_only=True,
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
        model = RegistrationRequest

        fields = (
            "id",
            "fullName",
            "phone",
            "age",
            "level",
            "instrument",
            "classType",
            "preferredDay",
            "preferredDayLabel",
            "preferredTime",
            "message",
            "status",
            "createdAt",
            "updatedAt",
        )

        read_only_fields = fields


class RegistrationRequestStatusUpdateSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = RegistrationRequest
        fields = (
            "status",
        )

    @transaction.atomic
    def update(
        self,
        instance,
        validated_data,
    ):
        registration = super().update(
            instance,
            validated_data,
        )

        if (
            registration.status
            != RegistrationRequest.Status.APPROVED
        ):
            return registration

        student_level = (
            registration.level
            if registration.level
            in Student.Level.values
            else ""
        )

        student, created = (
            Student.objects.get_or_create(
                phone=registration.phone,
                defaults={
                    "full_name": (
                        registration.full_name
                    ),
                    "age": registration.age,
                    "level": student_level,
                    "notes": registration.message,
                    "is_active": True,
                },
            )
        )

        if (
            not created
            and not student.is_active
        ):
            student.is_active = True

            student.save(
                update_fields=[
                    "is_active",
                    "updated_at",
                ]
            )

        return registration