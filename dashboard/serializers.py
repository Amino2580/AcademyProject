from rest_framework import serializers

from registrations.serializers import (
    RegistrationRequestAdminSerializer,
)
from schedules.models import ClassBooking


class DashboardTodayClassSerializer(
    serializers.ModelSerializer
):
    studentName = serializers.CharField(
        source="student_name",
        read_only=True,
    )

    startTime = serializers.TimeField(
        source="start_time",
        format="%H:%M",
        read_only=True,
    )

    status = serializers.SerializerMethodField()

    class Meta:
        model = ClassBooking

        fields = (
            "id",
            "studentName",
            "phone",
            "instrument",
            "notes",
            "startTime",
            "status",
        )

        read_only_fields = fields

    def get_status(self, booking):
        if (
            booking.pk
            == self.context.get("next_class_id")
        ):
            return "next"

        current_time = self.context.get(
            "current_time"
        )

        if (
            current_time is not None
            and booking.start_time < current_time
        ):
            return "passed"

        return "upcoming"


class DashboardSerializer(serializers.Serializer):
    totalStudents = serializers.IntegerField()
    activeClasses = serializers.IntegerField()
    newRegistrations = serializers.IntegerField()
    todayClasses = serializers.IntegerField()

    todaySchedule = (
        DashboardTodayClassSerializer(
            many=True,
        )
    )

    recentRegistrations = (
        RegistrationRequestAdminSerializer(
            many=True,
        )
    )