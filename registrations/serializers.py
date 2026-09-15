import re

from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from schedules.availability_service import (
    get_day_for_date,
    is_slot_available,
)
from schedules.models import (
    ClassBooking,
    ClassSession,
)
from schedules.session_service import (
    get_first_class_date,
    get_or_create_enrollment,
    get_reusable_enrollment,
    get_term_expiration_date,
    session_dates_have_conflict,
    sync_booking_sessions,
)
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

    preferredDate = serializers.DateField(
        source="preferred_date",
        format="%Y-%m-%d",
        input_formats=[
            "%Y-%m-%d",
        ],
        required=False,
        allow_null=True,
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
            "preferredDate",
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
        preferred_date = attrs.get(
            "preferred_date"
        )

        preferred_day = attrs.get(
            "preferred_day",
            "",
        )

        preferred_time = attrs.get(
            "preferred_time"
        )

        has_date = (
            preferred_date is not None
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

        if has_date and not (
            has_day and has_time
        ):
            raise serializers.ValidationError(
                {
                    "preferredDate": (
                        "Preferred date requires "
                        "a day and time."
                    )
                }
            )

        if has_date:
            if (
                preferred_date
                < timezone.localdate()
            ):
                raise serializers.ValidationError(
                    {
                        "preferredDate": (
                            "The selected date "
                            "cannot be in the past."
                        )
                    }
                )

            actual_day = get_day_for_date(
                preferred_date
            )

            if actual_day != preferred_day:
                raise serializers.ValidationError(
                    {
                        "preferredDate": (
                            "The selected date does "
                            "not match the selected day."
                        )
                    }
                )

        if (
            has_day
            and not is_slot_available(
                preferred_day,
                preferred_time,
                requested_date=preferred_date,
            )
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

    preferredDate = serializers.DateField(
        source="preferred_date",
        format="%Y-%m-%d",
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

    termStartsOn = serializers.DateField(
        source="enrollment.starts_on",
        format="%Y-%m-%d",
        read_only=True,
    )

    termExpiresOn = serializers.DateField(
        source="enrollment.expires_on",
        format="%Y-%m-%d",
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
            "preferredDate",
            "preferredDay",
            "preferredDayLabel",
            "preferredTime",
            "message",
            "status",
            "termStartsOn",
            "termExpiresOn",
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

    @staticmethod
    def get_first_session_date(registration):
        return get_first_class_date(
            registration.preferred_day,
            registration.preferred_time,
            preferred_date=(
                registration.preferred_date
            ),
        )

    @staticmethod
    def get_booking_at_first_session(
        registration,
        first_session_date,
    ):
        session = (
            ClassSession.objects
            .select_related(
                "booking",
                "booking__enrollment",
            )
            .filter(
                date=first_session_date,
                start_time=(
                    registration.preferred_time
                ),
                booking__day=(
                    registration.preferred_day
                ),
            )
            .first()
        )

        if session is not None:
            return session.booking

        return (
            ClassBooking.objects.filter(
                enrollment__isnull=True,
                day=registration.preferred_day,
                start_time=(
                    registration.preferred_time
                ),
            )
            .first()
        )

    def validate_approval_slot(
        self,
        registration,
    ):
        first_session_date = (
            self.get_first_session_date(
                registration
            )
        )

        existing_booking = (
            self.get_booking_at_first_session(
                registration,
                first_session_date,
            )
        )

        if (
            existing_booking is not None
            and existing_booking.phone
            != registration.phone
        ):
            raise serializers.ValidationError(
                {
                    "status": (
                        "این زمان قبلاً به هنرجوی "
                        "دیگری اختصاص داده شده است."
                    )
                }
            )

        if (
            existing_booking is None
            and not is_slot_available(
                registration.preferred_day,
                registration.preferred_time,
                requested_date=(
                    first_session_date
                ),
            )
        ):
            raise serializers.ValidationError(
                {
                    "status": (
                        "زمان درخواستی دیگر "
                        "قابل رزرو نیست."
                    )
                }
            )

        student = (
            Student.objects.filter(
                phone=registration.phone
            ).first()
        )

        enrollment = (
            registration.enrollment
        )

        if (
            enrollment is None
            and existing_booking is not None
        ):
            enrollment = (
                existing_booking.enrollment
            )

        if enrollment is None and student:
            enrollment = get_reusable_enrollment(
                student,
                first_session_date,
            )

        starts_on = first_session_date

        if (
            enrollment
            and enrollment.starts_on
            <= first_session_date
        ):
            starts_on = enrollment.starts_on

        expires_on = (
            enrollment.expires_on
            if (
                enrollment
                and starts_on
                == enrollment.starts_on
            )
            else get_term_expiration_date(
                starts_on
            )
        )

        if session_dates_have_conflict(
            registration.preferred_day,
            registration.preferred_time,
            starts_on,
            expires_on,
            exclude_booking=existing_booking,
        ):
            raise serializers.ValidationError(
                {
                    "status": (
                        "این ساعت در بخشی از دوره "
                        "یک‌ماهه رزرو شده است."
                    )
                }
            )

        return (
            first_session_date,
            existing_booking,
        )

    @transaction.atomic
    def update(
        self,
        instance,
        validated_data,
    ):
        target_status = validated_data.get(
            "status",
            instance.status,
        )

        first_session_date = None
        existing_booking = None

        should_create_schedule = (
            target_status
            == RegistrationRequest.Status.APPROVED
            and instance.preferred_day
            and instance.preferred_time
        )

        if should_create_schedule:
            (
                first_session_date,
                existing_booking,
            ) = self.validate_approval_slot(
                instance
            )

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
                    "notes": (
                        registration.message
                    ),
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

        if not should_create_schedule:
            return registration

        enrollment = registration.enrollment

        if (
            enrollment is None
            and existing_booking is not None
        ):
            enrollment = (
                existing_booking.enrollment
            )

        if enrollment is None:
            enrollment = get_or_create_enrollment(
                student,
                first_session_date,
            )

        if (
            registration.enrollment_id
            != enrollment.id
        ):
            registration.enrollment = enrollment
            registration.save(
                update_fields=[
                    "enrollment",
                    "updated_at",
                ]
            )

        booking = existing_booking

        if booking is None:
            booking = (
                ClassBooking.objects.filter(
                    enrollment=enrollment,
                    day=registration.preferred_day,
                    start_time=(
                        registration.preferred_time
                    ),
                    phone=registration.phone,
                )
                .first()
            )

        if booking is None:
            booking = ClassBooking.objects.create(
                enrollment=enrollment,
                student=student,
                day=registration.preferred_day,
                start_time=(
                    registration.preferred_time
                ),
                student_name=(
                    registration.full_name
                ),
                phone=registration.phone,
                instrument=(
                    registration.instrument
                ),
                notes=registration.message,
            )
        else:
            booking.enrollment = enrollment
            booking.student = student
            booking.student_name = (
                registration.full_name
            )
            booking.instrument = (
                registration.instrument
            )
            booking.notes = registration.message
            booking.save(
                update_fields=[
                    "enrollment",
                    "student",
                    "student_name",
                    "instrument",
                    "notes",
                    "updated_at",
                ]
            )

        sync_booking_sessions(booking)

        return registration
