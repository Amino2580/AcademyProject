from datetime import date

from django.db.models import (
    Case,
    IntegerField,
    Q,
    Value,
    When,
)

from django.utils import timezone

from rest_framework import status

from rest_framework.filters import (
    OrderingFilter,
    SearchFilter,
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

from .models import ClassBooking

from .serializers import (
    ClassBookingSerializer,
    MyScheduleSerializer,
)


WEEKDAY_NUMBERS = {
    ClassBooking.Weekday.MONDAY: 0,
    ClassBooking.Weekday.TUESDAY: 1,
    ClassBooking.Weekday.WEDNESDAY: 2,
    ClassBooking.Weekday.THURSDAY: 3,
    ClassBooking.Weekday.SATURDAY: 5,
    ClassBooking.Weekday.SUNDAY: 6,
}


def get_upcoming_class_order():
    current_date_time = (
        timezone.localtime()
    )

    current_weekday = (
        current_date_time.weekday()
    )

    current_time = (
        current_date_time.time()
    )

    ordering_conditions = []

    for (
        day_value,
        weekday_number,
    ) in WEEKDAY_NUMBERS.items():
        days_until_class = (
            weekday_number
            - current_weekday
        ) % 7

        if days_until_class == 0:
            ordering_conditions.append(
                When(
                    day=day_value,
                    start_time__lt=current_time,
                    then=Value(7),
                )
            )

        ordering_conditions.append(
            When(
                day=day_value,
                then=Value(
                    days_until_class
                ),
            )
        )

    return Case(
        *ordering_conditions,
        default=Value(8),
        output_field=IntegerField(),
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

        return queryset


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
                ClassBooking.objects.none()
            )

        return (
            ClassBooking.objects
            .select_related("student")
            .filter(
                Q(
                    student__phone=(
                        profile.phone
                    )
                )
                | Q(
                    phone=profile.phone
                )
            )
            .annotate(
                upcoming_order=(
                    get_upcoming_class_order()
                )
            )
            .order_by(
                "upcoming_order",
                "start_time",
            )
        )