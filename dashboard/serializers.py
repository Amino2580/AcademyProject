from rest_framework import serializers

from registrations.serializers import (
    RegistrationRequestAdminSerializer,
)


class DashboardSerializer(serializers.Serializer):
    totalStudents = serializers.IntegerField()
    activeClasses = serializers.IntegerField()
    newRegistrations = serializers.IntegerField()
    todayClasses = serializers.IntegerField()

    recentRegistrations = (
        RegistrationRequestAdminSerializer(
            many=True,
        )
    )