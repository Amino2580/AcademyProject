from datetime import date, timedelta

from django.db.models import Q

from django.utils import timezone

from rest_framework import status

from rest_framework.filters import (
    OrderingFilter,
    SearchFilter,
)

from rest_framework.exceptions import (
    ValidationError,
)

from rest_framework.generics import (
    ListAPIView,
    ListCreateAPIView,
    RetrieveUpdateDestroyAPIView,
)

from rest_framework.permissions import (
    AllowAny,
    IsAdminUser,
    IsAuthenticated,
)

from rest_framework.response import Response
from rest_framework.views import APIView

from .availability_service import (
    get_public_unavailable_slots,
    get_week_start,
)

from .models import (
    ClassBooking,
    ClassSession,
)

from .serializers import (
    ClassBookingSerializer,
    MyScheduleSerializer,
)


class ClassBookingAdminListCreateView(
    ListCreateAPIView
):
    queryset = ClassBooking.objects.all()
    serializer_class = ClassBookingSerializer

    permission_classes = [
        IsAdminUser,
    ]

    pagination_class = None

    filter_backends = [
        SearchFilter,
        OrderingFilter,
    ]

    search_fields = [
        "student_name",
        "phone",
        "instrument",
        "notes",
    ]

    ordering_fields = [
        "day",
        "start_time",
        "created_at",
        "updated_at",
    ]

    ordering = [
        "day",
        "start_time",
    ]

    def get_queryset(self):
        queryset = (
            super().get_queryset()
            .select_related(
                "student",
                "enrollment",
            )
        )

        week_start_value = (
            self.request.query_params.get(
                "weekStart"
            )
        )

        if week_start_value:
            try:
                week_start = date.fromisoformat(
                    week_start_value
                )
            except ValueError as exc:
                raise ValidationError(
                    {
                        "weekStart": (
                            "تاریخ شروع هفته "
                            "نامعتبر است."
                        )
                    }
                ) from exc

            if week_start.weekday() != 5:
                raise ValidationError(
                    {
                        "weekStart": (
                            "تاریخ شروع هفته باید "
                            "روز شنبه باشد."
                        )
                    }
                )

            week_end = week_start + timedelta(
                days=6
            )

            queryset = queryset.filter(
                Q(enrollment__isnull=True)
                | Q(
                    sessions__date__gte=week_start,
                    sessions__date__lte=week_end,
                )
            )
        else:
            queryset = queryset.filter(
                Q(enrollment__isnull=True)
                | Q(
                    enrollment__is_active=True,
                    enrollment__expires_on__gt=(
                        timezone.localdate()
                    ),
                )
            )

        day = (
            self.request
            .query_params
            .get("day")
        )

        if day:
            queryset = queryset.filter(
                day=day
            )

        return queryset.distinct()


class ClassBookingAdminDetailView(
    RetrieveUpdateDestroyAPIView
):
    queryset = ClassBooking.objects.all()
    serializer_class = ClassBookingSerializer

    permission_classes = [
        IsAdminUser,
    ]

    http_method_names = [
        "get",
        "patch",
        "delete",
        "head",
        "options",
    ]


class PublicScheduleAvailabilityView(
    APIView
):
    permission_classes = [
        AllowAny,
    ]

    def get(
        self,
        request,
    ):
        week_start_value = (
            request.query_params.get(
                "weekStart"
            )
        )

        if week_start_value:
            try:
                week_start = (
                    date.fromisoformat(
                        week_start_value
                    )
                )
            except ValueError:
                return Response(
                    {
                        "weekStart": (
                            "تاریخ شروع هفته "
                            "نامعتبر است."
                        )
                    },
                    status=(
                        status
                        .HTTP_400_BAD_REQUEST
                    ),
                )

            if week_start.weekday() != 5:
                return Response(
                    {
                        "weekStart": (
                            "تاریخ شروع هفته "
                            "باید روز شنبه باشد."
                        )
                    },
                    status=(
                        status
                        .HTTP_400_BAD_REQUEST
                    ),
                )
        else:
            week_start = get_week_start()

        return Response(
            get_public_unavailable_slots(
                week_start=week_start
            )
        )


class MyScheduleListView(
    ListAPIView
):
    serializer_class = (
        MyScheduleSerializer
    )

    permission_classes = [
        IsAuthenticated,
    ]

    pagination_class = None

    def get_queryset(self):
        profile = getattr(
            self.request.user,
            "profile",
            None,
        )

        if profile is None:
            return (
                ClassSession.objects.none()
            )

        current_date_time = timezone.localtime()
        current_time = (
            current_date_time.time()
            .replace(tzinfo=None)
        )

        return (
            ClassSession.objects
            .select_related(
                "booking",
                "booking__student",
                "booking__enrollment",
                "availability_exception",
            )
            .filter(
                booking__enrollment__is_active=True,
                booking__enrollment__expires_on__gt=(
                    current_date_time.date()
                ),
            )
            .filter(
                (
                    Q(
                        booking__student__phone=(
                            profile.phone
                        )
                    )
                    | Q(
                        booking__phone=profile.phone
                    )
                )
            )
            .filter(
                Q(
                    date__gt=(
                        current_date_time.date()
                    )
                )
                | Q(
                    date=(
                        current_date_time.date()
                    ),
                    start_time__gte=current_time,
                )
            )
            .order_by(
                "date",
                "start_time",
            )
        )
