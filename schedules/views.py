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
)

from .models import ClassBooking
from .serializers import (
    ClassBookingSerializer,
    PublicScheduleAvailabilitySerializer,
)

class ClassBookingAdminListCreateView(
    ListCreateAPIView
):
    queryset = ClassBooking.objects.all()
    serializer_class = ClassBookingSerializer
    permission_classes = [IsAdminUser]

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
        queryset = super().get_queryset()

        day = self.request.query_params.get(
            "day"
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
    permission_classes = [IsAdminUser]

    http_method_names = [
        "get",
        "patch",
        "delete",
        "head",
        "options",
    ]

class PublicScheduleAvailabilityView(
    ListAPIView
):
    queryset = (
        ClassBooking.objects
        .all()
        .order_by(
            "day",
            "start_time",
        )
    )

    serializer_class = (
        PublicScheduleAvailabilitySerializer
    )

    permission_classes = [
        AllowAny,
    ]

    pagination_class = None