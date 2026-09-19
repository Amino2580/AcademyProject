from datetime import time

from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import serializers

from .models import (
    AvailabilityException,
    ClassBooking,
    ClassOffering,
    WeeklyAvailability,
)
from .session_service import (
    restore_sessions_for_exception,
    sync_sessions_for_exception,
)


FIRST_ALLOWED_TIME = time(7, 0)
LAST_ALLOWED_TIME = time(19, 30)


def validate_schedule_time(value):
    if value is None:
        return value

    if (
        value.minute not in (0, 30)
        or value.second != 0
        or value.microsecond != 0
    ):
        raise serializers.ValidationError(
            "زمان باید در بازه‌های نیم‌ساعته باشد."
        )

    if not (
        FIRST_ALLOWED_TIME
        <= value
        <= LAST_ALLOWED_TIME
    ):
        raise serializers.ValidationError(
            "زمان باید بین 07:00 و 19:30 باشد."
        )

    return value


class WeeklyAvailabilitySerializer(
    serializers.ModelSerializer
):
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
        model = WeeklyAvailability

        fields = (
            "id",
            "day",
            "dayLabel",
            "startTime",
            "endTime",
            "createdAt",
            "updatedAt",
        )

        read_only_fields = (
            "id",
            "dayLabel",
            "createdAt",
            "updatedAt",
        )

        validators = []

    def validate_startTime(
        self,
        value,
    ):
        return validate_schedule_time(
            value
        )

    def validate_endTime(
        self,
        value,
    ):
        return validate_schedule_time(
            value
        )

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

        if (
            start_time is not None
            and end_time is not None
            and start_time >= end_time
        ):
            raise serializers.ValidationError(
                {
                    "endTime": (
                        "ساعت پایان باید بعد از "
                        "ساعت شروع باشد."
                    )
                }
            )

        overlapping_ranges = (
            WeeklyAvailability.objects.filter(
                day=day,
                start_time__lt=end_time,
                end_time__gt=start_time,
            )
        )

        if self.instance is not None:
            overlapping_ranges = (
                overlapping_ranges.exclude(
                    pk=self.instance.pk
                )
            )

        if overlapping_ranges.exists():
            raise serializers.ValidationError(
                {
                    "startTime": (
                        "این بازه با یکی از "
                        "ساعات ثبت‌شده تداخل دارد."
                    )
                }
            )

        return attrs


class ClassOfferingSerializer(
    serializers.ModelSerializer
):
    dayLabel = serializers.CharField(
        source="get_day_display",
        read_only=True,
    )

    classType = serializers.ChoiceField(
        source="class_type",
        choices=ClassBooking.ClassType.choices,
    )

    classTypeLabel = serializers.CharField(
        source="get_class_type_display",
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
    )

    isActive = serializers.BooleanField(
        source="is_active",
        required=False,
    )

    bookedCount = serializers.SerializerMethodField()
    remainingCapacity = serializers.SerializerMethodField()

    createdAt = serializers.DateTimeField(
        source="created_at",
        read_only=True,
    )

    updatedAt = serializers.DateTimeField(
        source="updated_at",
        read_only=True,
    )

    class Meta:
        model = ClassOffering

        fields = (
            "id",
            "day",
            "dayLabel",
            "classType",
            "classTypeLabel",
            "startTime",
            "endTime",
            "capacity",
            "bookedCount",
            "remainingCapacity",
            "isActive",
            "createdAt",
            "updatedAt",
        )

        read_only_fields = (
            "id",
            "dayLabel",
            "classTypeLabel",
            "bookedCount",
            "remainingCapacity",
            "createdAt",
            "updatedAt",
        )

        validators = []

    def get_bookedCount(self, obj):
        return obj.bookings.filter(
            enrollment__is_active=True,
            enrollment__expires_on__gt=(
                timezone.localdate()
            ),
        ).count()

    def get_remainingCapacity(self, obj):
        return max(
            0,
            obj.capacity
            - self.get_bookedCount(obj),
        )

    def validate_startTime(self, value):
        return validate_schedule_time(value)

    def validate_endTime(self, value):
        return validate_schedule_time(value)

    def validate(self, attrs):
        day = attrs.get(
            "day",
            getattr(self.instance, "day", None),
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
        class_type = attrs.get(
            "class_type",
            getattr(
                self.instance,
                "class_type",
                None,
            ),
        )
        capacity = attrs.get(
            "capacity",
            getattr(
                self.instance,
                "capacity",
                1,
            ),
        )

        if start_time >= end_time:
            raise serializers.ValidationError(
                {
                    "endTime": (
                        "ساعت پایان باید بعد از "
                        "ساعت شروع باشد."
                    )
                }
            )

        if (
            class_type
            == ClassBooking.ClassType.PRIVATE
            and capacity != 1
        ):
            raise serializers.ValidationError(
                {
                    "capacity": (
                        "ظرفیت کلاس خصوصی باید "
                        "یک نفر باشد."
                    )
                }
            )

        if (
            class_type
            == ClassBooking.ClassType.GROUP
            and capacity < 2
        ):
            raise serializers.ValidationError(
                {
                    "capacity": (
                        "ظرفیت کلاس گروهی باید "
                        "حداقل دو نفر باشد."
                    )
                }
            )

        is_inside_working_hours = (
            WeeklyAvailability.objects.filter(
                day=day,
                start_time__lte=start_time,
                end_time__gte=end_time,
            ).exists()
        )

        if not is_inside_working_hours:
            raise serializers.ValidationError(
                {
                    "startTime": (
                        "این کلاس باید کاملاً داخل "
                        "ساعات حضور استاد باشد."
                    )
                }
            )

        overlapping_offerings = (
            ClassOffering.objects.filter(
                day=day,
                is_active=True,
                start_time__lt=end_time,
                end_time__gt=start_time,
            )
        )

        if self.instance is not None:
            overlapping_offerings = (
                overlapping_offerings.exclude(
                    pk=self.instance.pk
                )
            )

        if overlapping_offerings.exists():
            raise serializers.ValidationError(
                {
                    "startTime": (
                        "این بازه با برنامهٔ نوع کلاس "
                        "دیگری تداخل دارد."
                    )
                }
            )

        if self.instance is not None:
            schedule_changed = any((
                day != self.instance.day,
                start_time != self.instance.start_time,
                end_time != self.instance.end_time,
                class_type != self.instance.class_type,
            ))

            if (
                schedule_changed
                and self.instance.bookings.exists()
            ):
                raise serializers.ValidationError(
                    "برای برنامه‌ای که هنرجو دارد، "
                    "روز، ساعت یا نوع کلاس قابل "
                    "تغییر نیست."
                )

        conflicting_bookings = (
            ClassBooking.objects.filter(
                day=day,
                start_time__lt=end_time,
                end_time__gt=start_time,
            ).filter(
                Q(enrollment__isnull=True)
                | Q(
                    enrollment__is_active=True,
                    enrollment__expires_on__gt=(
                        timezone.localdate()
                    ),
                )
            )
        )

        if self.instance is not None:
            conflicting_bookings = (
                conflicting_bookings.exclude(
                    offering=self.instance
                )
            )

        if conflicting_bookings.exists():
            raise serializers.ValidationError(
                {
                    "startTime": (
                        "در این بازه کلاس ثبت‌شده‌ای "
                        "وجود دارد."
                    )
                }
            )

        return attrs


class AvailabilityExceptionSerializer(
    serializers.ModelSerializer
):
    startTime = serializers.TimeField(
        source="start_time",
        format="%H:%M",
        input_formats=[
            "%H:%M",
            "%H:%M:%S",
        ],
        required=False,
        allow_null=True,
    )

    endTime = serializers.TimeField(
        source="end_time",
        format="%H:%M",
        input_formats=[
            "%H:%M",
            "%H:%M:%S",
        ],
        required=False,
        allow_null=True,
    )

    isFullDay = serializers.BooleanField(
        source="is_full_day",
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
        model = AvailabilityException

        fields = (
            "id",
            "date",
            "startTime",
            "endTime",
            "isFullDay",
            "reason",
            "createdAt",
            "updatedAt",
        )

        read_only_fields = (
            "id",
            "isFullDay",
            "createdAt",
            "updatedAt",
        )

        validators = []

        extra_kwargs = {
            "reason": {
                "required": False,
                "allow_blank": True,
            },
        }

    def validate_date(
        self,
        value,
    ):
        if value < timezone.localdate():
            raise serializers.ValidationError(
                "امکان ثبت تعطیلی برای "
                "تاریخ گذشته وجود ندارد."
            )

        return value

    def validate_startTime(
        self,
        value,
    ):
        return validate_schedule_time(
            value
        )

    def validate_endTime(
        self,
        value,
    ):
        return validate_schedule_time(
            value
        )

    def validate(self, attrs):
        exception_date = attrs.get(
            "date",
            getattr(
                self.instance,
                "date",
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

        has_start_time = (
            start_time is not None
        )

        has_end_time = (
            end_time is not None
        )

        if has_start_time != has_end_time:
            raise serializers.ValidationError(
                {
                    "startTime": (
                        "ساعت شروع و پایان باید "
                        "با هم وارد شوند."
                    )
                }
            )

        if (
            has_start_time
            and start_time >= end_time
        ):
            raise serializers.ValidationError(
                {
                    "endTime": (
                        "ساعت پایان باید بعد از "
                        "ساعت شروع باشد."
                    )
                }
            )

        exceptions = (
            AvailabilityException.objects.filter(
                date=exception_date
            )
        )

        if self.instance is not None:
            exceptions = exceptions.exclude(
                pk=self.instance.pk
            )

        if not has_start_time:
            if exceptions.exists():
                raise serializers.ValidationError(
                    {
                        "date": (
                            "برای این تاریخ قبلاً "
                            "تعطیلی ثبت شده است."
                        )
                    }
                )

            return attrs

        full_day_exception_exists = (
            exceptions.filter(
                start_time__isnull=True,
                end_time__isnull=True,
            ).exists()
        )

        if full_day_exception_exists:
            raise serializers.ValidationError(
                {
                    "date": (
                        "این تاریخ قبلاً به‌صورت "
                        "کامل تعطیل شده است."
                    )
                }
            )

        overlapping_exceptions = (
            exceptions.filter(
                start_time__lt=end_time,
                end_time__gt=start_time,
            )
        )

        if overlapping_exceptions.exists():
            raise serializers.ValidationError(
                {
                    "startTime": (
                        "این بازه با یکی از "
                        "تعطیلی‌های ثبت‌شده "
                        "تداخل دارد."
                    )
                }
            )

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        exception = super().create(
            validated_data
        )

        sync_sessions_for_exception(
            exception
        )

        return exception

    @transaction.atomic
    def update(
        self,
        instance,
        validated_data,
    ):
        restore_sessions_for_exception(
            instance
        )

        exception = super().update(
            instance,
            validated_data,
        )

        sync_sessions_for_exception(
            exception
        )

        return exception
