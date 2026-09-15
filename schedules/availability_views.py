from django.db import transaction

from rest_framework.generics import (
    ListCreateAPIView,
    RetrieveUpdateDestroyAPIView,
)

from rest_framework.permissions import (
    IsAdminUser,
)

from .availability_serializers import (
    AvailabilityExceptionSerializer,
    WeeklyAvailabilitySerializer,
)

from .models import (
    AvailabilityException,
    WeeklyAvailability,
)
from .session_service import (
    restore_sessions_for_exception,
)


class WeeklyAvailabilityListCreateView(
    ListCreateAPIView
):
    serializer_class = (
        WeeklyAvailabilitySerializer
    )

    permission_classes = [
        IsAdminUser,
    ]

    pagination_class = None

    def get_queryset(self):
        queryset = (
            WeeklyAvailability.objects
            .all()
            .order_by(
                "day",
                "start_time",
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

        return queryset


class WeeklyAvailabilityDetailView(
    RetrieveUpdateDestroyAPIView
):
    queryset = (
        WeeklyAvailability.objects.all()
    )

    serializer_class = (
        WeeklyAvailabilitySerializer
    )

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


class AvailabilityExceptionListCreateView(
    ListCreateAPIView
):
    serializer_class = (
        AvailabilityExceptionSerializer
    )

    permission_classes = [
        IsAdminUser,
    ]

    pagination_class = None

    def get_queryset(self):
        queryset = (
            AvailabilityException.objects
            .all()
            .order_by(
                "date",
                "start_time",
            )
        )

        exception_date = (
            self.request
            .query_params
            .get("date")
        )

        date_from = (
            self.request
            .query_params
            .get("dateFrom")
        )

        date_to = (
            self.request
            .query_params
            .get("dateTo")
        )

        if exception_date:
            queryset = queryset.filter(
                date=exception_date
            )

        if date_from:
            queryset = queryset.filter(
                date__gte=date_from
            )

        if date_to:
            queryset = queryset.filter(
                date__lte=date_to
            )

        return queryset


class AvailabilityExceptionDetailView(
    RetrieveUpdateDestroyAPIView
):
    queryset = (
        AvailabilityException.objects.all()
    )

    serializer_class = (
        AvailabilityExceptionSerializer
    )

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

    @transaction.atomic
    def perform_destroy(self, instance):
        restore_sessions_for_exception(
            instance
        )

        super().perform_destroy(instance)
