from django.db import transaction
from rest_framework import serializers

from accounts.services import (
    InvalidPhoneNumber,
    normalize_phone,
)
from students.models import Student

from .models import ClassBooking


class ClassBookingSerializer(
    serializers.ModelSerializer
):
    studentId = serializers.IntegerField(
        source="student_id",
        read_only=True,
    )

    dayLabel = serializers.CharField(
        source="get_day_display",
        read_only=True,
    )

    startTime = serializers.TimeField(
        source="start_time",
        format="%H:%M",
        input_formats=[
            "%H:%M",
            "%H:%M:%S",
        ],
    )

    name = serializers.CharField(
        source="student_name",
        max_length=150,
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
        model = ClassBooking

        fields = (
            "id",
            "studentId",
            "day",
            "dayLabel",
            "startTime",
            "name",
            "phone",
            "instrument",
            "notes",
            "createdAt",
            "updatedAt",
        )

        read_only_fields = (
            "id",
            "studentId",
            "dayLabel",
            "createdAt",
            "updatedAt",
        )

        extra_kwargs = {
            "instrument": {
                "required": False,
                "allow_blank": True,
            },
            "notes": {
                "required": False,
                "allow_blank": True,
            },
        }

        validators = []


    def validate_phone(self, value):
        try:
            return normalize_phone(value)
        except InvalidPhoneNumber as exc:
            raise serializers.ValidationError(
                str(exc)
            ) from exc


    def validate_startTime(self, value):
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
        day = attrs.get(
            "day",
            getattr(
                self.instance,
                "day",
                None,
            ),
        )

        start_time = attrs.get(
            "start_time",
            getattr(
                self.instance,
                "start_time",
                None,
            ),
        )

        queryset = ClassBooking.objects.filter(
            day=day,
            start_time=start_time,
        )

        if self.instance:
            queryset = queryset.exclude(
                pk=self.instance.pk
            )

        if queryset.exists():
            raise serializers.ValidationError(
                {
                    "startTime": (
                        "This time slot is already booked."
                    )
                }
            )

        return attrs


    @staticmethod
    def get_or_create_student(
        phone,
        full_name,
    ):
        student, created = (
            Student.objects.get_or_create(
                phone=phone,
                defaults={
                    "full_name": full_name,
                },
            )
        )

        if not created and not student.is_active:
            student.is_active = True
            student.save(
                update_fields=[
                    "is_active",
                    "updated_at",
                ]
            )

        return student


    @transaction.atomic
    def create(self, validated_data):
        student = self.get_or_create_student(
            phone=validated_data["phone"],
            full_name=validated_data[
                "student_name"
            ],
        )

        validated_data["student"] = student

        return super().create(
            validated_data
        )


    @transaction.atomic
    def update(
        self,
        instance,
        validated_data,
    ):
        phone = validated_data.get(
            "phone",
            instance.phone,
        )

        full_name = validated_data.get(
            "student_name",
            instance.student_name,
        )

        student = self.get_or_create_student(
            phone=phone,
            full_name=full_name,
        )

        validated_data["student"] = student

        return super().update(
            instance,
            validated_data,
        )