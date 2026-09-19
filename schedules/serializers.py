from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from accounts.services import (
    InvalidPhoneNumber,
    normalize_phone,
)
from students.models import Student

from .availability_service import (
    get_day_for_date,
)
from .models import (
    ClassBooking,
    ClassOffering,
    ClassSession,
    default_end_time,
)
from .session_service import (
    get_first_class_date,
    get_or_create_enrollment,
    get_reusable_enrollment,
    get_term_expiration_date,
    session_dates_have_conflict,
    sync_booking_sessions,
)


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

    endTime = serializers.TimeField(
        source="end_time",
        format="%H:%M",
        input_formats=[
            "%H:%M",
            "%H:%M:%S",
        ],
        required=False,
    )

    classType = serializers.ChoiceField(
        source="class_type",
        choices=ClassBooking.ClassType.choices,
        required=False,
    )

    classTypeLabel = serializers.CharField(
        source="get_class_type_display",
        read_only=True,
    )

    offeringId = serializers.PrimaryKeyRelatedField(
        source="offering",
        queryset=ClassOffering.objects.filter(
            is_active=True
        ),
        required=False,
        allow_null=True,
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

    firstClassDate = serializers.DateField(
        source="first_class_date",
        format="%Y-%m-%d",
        input_formats=[
            "%Y-%m-%d",
        ],
        required=False,
        write_only=True,
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
        model = ClassBooking

        fields = (
            "id",
            "studentId",
            "day",
            "dayLabel",
            "startTime",
            "endTime",
            "classType",
            "classTypeLabel",
            "offeringId",
            "name",
            "phone",
            "instrument",
            "notes",
            "firstClassDate",
            "termStartsOn",
            "termExpiresOn",
            "createdAt",
            "updatedAt",
        )

        read_only_fields = (
            "id",
            "studentId",
            "dayLabel",
            "classTypeLabel",
            "termStartsOn",
            "termExpiresOn",
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


    def validate_endTime(self, value):
        if (
            value.minute not in (0, 30)
            or value.second != 0
            or value.microsecond != 0
            or value.hour < 7
            or (
                value.hour == 19
                and value.minute > 30
            )
            or value.hour > 19
        ):
            raise serializers.ValidationError(
                "Time must be between 07:00 and "
                "19:30 in 30-minute intervals."
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

        end_time = attrs.get(
            "end_time",
            getattr(
                self.instance,
                "end_time",
                None,
            ),
        )

        offering = attrs.get(
            "offering",
            getattr(
                self.instance,
                "offering",
                None,
            ),
        )

        if offering is not None:
            requested_values = {
                "day": day,
                "start_time": start_time,
                "end_time": end_time,
                "class_type": attrs.get(
                    "class_type",
                    getattr(
                        self.instance,
                        "class_type",
                        None,
                    ),
                ),
            }
            offering_values = {
                "day": offering.day,
                "start_time": offering.start_time,
                "end_time": offering.end_time,
                "class_type": offering.class_type,
            }

            for field, value in requested_values.items():
                if (
                    value is not None
                    and value != offering_values[field]
                ):
                    raise serializers.ValidationError(
                        {
                            "offeringId": (
                                "روز، ساعت و نوع کلاس "
                                "باید با برنامهٔ انتخابی "
                                "هماهنگ باشد."
                            )
                        }
                    )

            attrs.update(offering_values)
            day = offering.day
            start_time = offering.start_time
            end_time = offering.end_time

        if end_time is None:
            end_time = default_end_time(start_time)
            attrs["end_time"] = end_time

        if start_time >= end_time:
            raise serializers.ValidationError(
                {
                    "endTime": (
                        "ساعت پایان باید بعد از "
                        "ساعت شروع باشد."
                    )
                }
            )

        requested_first_class_date = attrs.get(
            "first_class_date"
        )

        first_class_date = (
            requested_first_class_date
        )

        if first_class_date is None:
            first_class_date = (
                get_first_class_date(
                    day,
                    start_time,
                )
            )

        if (
            get_day_for_date(first_class_date)
            != day
        ):
            raise serializers.ValidationError(
                {
                    "firstClassDate": (
                        "تاریخ اولین جلسه با روز "
                        "انتخاب‌شده هماهنگ نیست."
                    )
                }
            )

        current_date_time = timezone.localtime()
        current_time = (
            current_date_time.time()
            .replace(tzinfo=None)
        )

        if (
            first_class_date
            < current_date_time.date()
            or (
                first_class_date
                == current_date_time.date()
                and start_time
                <= current_time
            )
        ):
            raise serializers.ValidationError(
                {
                    "firstClassDate": (
                        "اولین جلسه باید در آینده باشد."
                    )
                }
            )

        phone = attrs.get(
            "phone",
            getattr(
                self.instance,
                "phone",
                "",
            ),
        )

        student = (
            Student.objects.filter(
                phone=phone
            ).first()
        )

        enrollment = None

        if (
            self.instance is not None
            and self.instance.enrollment_id
            and self.instance.student_id
            == getattr(student, "id", None)
            and (
                requested_first_class_date
                is None
                or (
                    self.instance.enrollment.starts_on
                    <= first_class_date
                    < self.instance.enrollment.expires_on
                )
            )
        ):
            enrollment = self.instance.enrollment

        if enrollment is None and student:
            enrollment = get_reusable_enrollment(
                student,
                first_class_date,
            )

        starts_on = first_class_date

        if (
            enrollment
            and enrollment.starts_on
            <= first_class_date
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
            day,
            start_time,
            starts_on,
            expires_on,
            exclude_booking=self.instance,
            end_time=end_time,
            offering=offering,
        ):
            raise serializers.ValidationError(
                {
                    "startTime": (
                        "این بازه در بخشی از دوره "
                        "یک‌ماهه ظرفیت ندارد یا "
                        "با کلاس دیگری تداخل دارد."
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
        first_class_date = (
            validated_data.pop(
                "first_class_date",
                None,
            )
        )

        student = self.get_or_create_student(
            phone=validated_data["phone"],
            full_name=validated_data[
                "student_name"
            ],
        )

        validated_data["student"] = student

        if first_class_date is None:
            first_class_date = (
                get_first_class_date(
                    validated_data["day"],
                    validated_data["start_time"],
                )
            )

        validated_data["enrollment"] = (
            get_or_create_enrollment(
                student,
                first_class_date,
            )
        )

        booking = super().create(
            validated_data
        )

        sync_booking_sessions(booking)

        return booking


    @transaction.atomic
    def update(
        self,
        instance,
        validated_data,
    ):
        first_class_date = (
            validated_data.pop(
                "first_class_date",
                None,
            )
        )

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

        should_replace_enrollment = (
            instance.enrollment_id is None
            or instance.student_id != student.id
            or first_class_date is not None
        )

        if should_replace_enrollment:
            if first_class_date is None:
                first_class_date = (
                    get_first_class_date(
                        validated_data.get(
                            "day",
                            instance.day,
                        ),
                        validated_data.get(
                            "start_time",
                            instance.start_time,
                        ),
                    )
                )

            validated_data["enrollment"] = (
                get_or_create_enrollment(
                    student,
                    first_class_date,
                )
            )

        booking = super().update(
            instance,
            validated_data,
        )

        sync_booking_sessions(booking)

        return booking

class PublicScheduleAvailabilitySerializer(
    serializers.ModelSerializer
):
    dayLabel = serializers.CharField(
        source="get_day_display",
        read_only=True,
    )

    startTime = serializers.TimeField(
        source="start_time",
        format="%H:%M",
        read_only=True,
    )

    isBooked = serializers.SerializerMethodField()

    class Meta:
        model = ClassBooking

        fields = (
            "day",
            "dayLabel",
            "startTime",
            "isBooked",
        )

        read_only_fields = fields

    def get_isBooked(self, obj):
        return True

class MyScheduleSerializer(
    serializers.ModelSerializer
):
    bookingId = serializers.IntegerField(
        source="booking_id",
        read_only=True,
    )

    day = serializers.CharField(
        source="booking.day",
        read_only=True,
    )

    dayLabel = serializers.CharField(
        source="booking.get_day_display",
        read_only=True,
    )

    startTime = serializers.TimeField(
        source="start_time",
        format="%H:%M",
        read_only=True,
    )

    endTime = serializers.TimeField(
        source="end_time",
        format="%H:%M",
        read_only=True,
    )

    classType = serializers.CharField(
        source="booking.class_type",
        read_only=True,
    )

    classTypeLabel = serializers.CharField(
        source="booking.get_class_type_display",
        read_only=True,
    )

    notes = serializers.CharField(
        source="booking.notes",
        read_only=True,
    )

    statusLabel = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )

    termStartsOn = serializers.DateField(
        source="booking.enrollment.starts_on",
        format="%Y-%m-%d",
        read_only=True,
    )

    termExpiresOn = serializers.DateField(
        source="booking.enrollment.expires_on",
        format="%Y-%m-%d",
        read_only=True,
    )

    class Meta:
        model = ClassSession

        fields = (
            "id",
            "bookingId",
            "date",
            "day",
            "dayLabel",
            "startTime",
            "endTime",
            "classType",
            "classTypeLabel",
            "notes",
            "status",
            "statusLabel",
            "cancellationReason",
            "termStartsOn",
            "termExpiresOn",
        )

        read_only_fields = fields

    cancellationReason = serializers.CharField(
        source="cancellation_reason",
        read_only=True,
    )
