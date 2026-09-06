from django.urls import path

from .views import (
    StudentAdminDetailView,
    StudentAdminListCreateView,
)


app_name = "student_admin"

urlpatterns = [
    path(
        "",
        StudentAdminListCreateView.as_view(),
        name="list-create",
    ),
    path(
        "<int:pk>/",
        StudentAdminDetailView.as_view(),
        name="detail",
    ),
]