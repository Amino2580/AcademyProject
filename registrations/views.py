from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.generics import (
    CreateAPIView,
    ListAPIView,
    RetrieveUpdateAPIView,
)
from rest_framework.permissions import AllowAny, IsAdminUser

from .models import RegistrationRequest
from .serializers import (
    RegistrationRequestAdminSerializer,
    RegistrationRequestCreateSerializer,
    RegistrationRequestStatusUpdateSerializer,
)


class RegistrationRequestCreateView(CreateAPIView):
    queryset = RegistrationRequest.objects.all()
    serializer_class = RegistrationRequestCreateSerializer
    permission_classes = [AllowAny]


class RegistrationRequestAdminListView(ListAPIView):
    queryset = RegistrationRequest.objects.all()
    serializer_class = RegistrationRequestAdminSerializer
    permission_classes = [IsAdminUser]

    filter_backends = [
        SearchFilter,
        OrderingFilter,
    ]

    search_fields = [
        "full_name",
        "phone",
    ]

    ordering_fields = [
        "created_at",
        "updated_at",
        "status",
    ]

    ordering = ["-created_at"]

    def get_queryset(self):
        queryset = super().get_queryset()

        requested_status = self.request.query_params.get(
            "status"
        )

        if requested_status:
            queryset = queryset.filter(
                status=requested_status
            )

        return queryset


class RegistrationRequestAdminDetailView(
    RetrieveUpdateAPIView
):
    queryset = RegistrationRequest.objects.all()
    permission_classes = [IsAdminUser]

    http_method_names = [
        "get",
        "patch",
        "head",
        "options",
    ]

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return RegistrationRequestStatusUpdateSerializer

        return RegistrationRequestAdminSerializer