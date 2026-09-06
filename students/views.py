from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.generics import (
    ListCreateAPIView,
    RetrieveUpdateDestroyAPIView,
)
from rest_framework.permissions import IsAdminUser

from .models import Student
from .serializers import StudentSerializer


class StudentAdminListCreateView(ListCreateAPIView):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
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
        "full_name",
        "level",
        "created_at",
        "updated_at",
    ]

    ordering = ["-created_at"]

    def get_queryset(self):
        queryset = super().get_queryset()

        active_param = self.request.query_params.get(
            "isActive",
            "true",
        )
        level_param = self.request.query_params.get("level")

        if active_param.lower() == "true":
            queryset = queryset.filter(is_active=True)
        elif active_param.lower() == "false":
            queryset = queryset.filter(is_active=False)

        if level_param:
            queryset = queryset.filter(level=level_param)

        return queryset


class StudentAdminDetailView(
    RetrieveUpdateDestroyAPIView
):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [IsAdminUser]

    http_method_names = [
        "get",
        "patch",
        "delete",
        "head",
        "options",
    ]

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(
            update_fields=[
                "is_active",
                "updated_at",
            ]
        )