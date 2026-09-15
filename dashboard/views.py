from django.db.models import Q
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
    4: ClassBooking.Weekday.FRIDAY,
    5: ClassBooking.Weekday.SATURDAY,
    6: ClassBooking.Weekday.SUNDAY,
}


class AdminDashboardView(APIView):
    permission_classes = (IsAdminUser,)

    @extend_schema(
        responses=DashboardSerializer,
    )
    def get(self, request):
        today = timezone.localdate()

        current_time = (
            timezone.localtime()
            .time()
            .replace(
                second=0,
                microsecond=0,
                tzinfo=None,
            )
        )

        today_value = WEEKDAY_MAP.get(
            today.weekday()
        )

        if today_value is None:
            today_schedule = (
                ClassBooking.objects.none()
            )
        else:
            today_schedule = (
                ClassBooking.objects.filter(
                    Q(
                        enrollment__isnull=True,
                        day=today_value,
                    )
                    | Q(
                        sessions__date=today
                    )
                )
                .distinct()
                .order_by(
                    "start_time",
                    "id",
                )
            )

        next_class_id = (
            today_schedule.filter(
                start_time__gte=current_time
            )
            .values_list(
                "id",
                flat=True,
            )
            .first()
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
                ClassBooking.objects.filter(
                    Q(enrollment__isnull=True)
                    | Q(
                        enrollment__is_active=True,
                        enrollment__expires_on__gt=today,
                    )
                )
                .distinct()
                .count()
            ),
            "newRegistrations": (
                RegistrationRequest.objects.filter(
                    status=(
                        RegistrationRequest.Status.NEW
                    )
                ).count()
            ),
            "todayClasses": (
                today_schedule.count()
            ),
            "todaySchedule": today_schedule,
            "recentRegistrations": (
                recent_registrations
            ),
        }

        serializer = DashboardSerializer(
            dashboard_data,
            context={
                "current_time": current_time,
                "next_class_id": next_class_id,
            },
        )

        return Response(serializer.data)
