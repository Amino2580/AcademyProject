from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from registrations.models import RegistrationRequest
from schedules.models import ClassBooking
from students.models import Student

from .serializers import DashboardSerializer


WEEKDAY_MAP = {
    0: ClassBooking.Weekday.MONDAY,
    1: ClassBooking.Weekday.TUESDAY,
    2: ClassBooking.Weekday.WEDNESDAY,
    3: ClassBooking.Weekday.THURSDAY,
    5: ClassBooking.Weekday.SATURDAY,
    6: ClassBooking.Weekday.SUNDAY,
}


class AdminDashboardView(APIView):
    permission_classes = (IsAdminUser,)

    @extend_schema(
        responses=DashboardSerializer,
    )
    def get(self, request):
        today_value = WEEKDAY_MAP.get(
            timezone.localdate().weekday()
        )

        if today_value is None:
            today_classes = 0
        else:
            today_classes = (
                ClassBooking.objects.filter(
                    day=today_value
                ).count()
            )

        recent_registrations = (
            RegistrationRequest.objects.order_by(
                "-created_at"
            )[:5]
        )

        dashboard_data = {
            "totalStudents": (
                Student.objects.filter(
                    is_active=True
                ).count()
            ),
            "activeClasses": (
                ClassBooking.objects.count()
            ),
            "newRegistrations": (
                RegistrationRequest.objects.filter(
                    status=RegistrationRequest.Status.NEW
                ).count()
            ),
            "todayClasses": today_classes,
            "recentRegistrations": (
                recent_registrations
            ),
        }

        serializer = DashboardSerializer(
            dashboard_data
        )

        return Response(serializer.data)