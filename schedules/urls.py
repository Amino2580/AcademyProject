from django.urls import path

from .views import (
    ClassBookingAdminDetailView,
    ClassBookingAdminListCreateView,
)


app_name = "schedule_admin"


urlpatterns = [
    path(
        "",
        ClassBookingAdminListCreateView.as_view(),
        name="list-create",
    ),
    path(
        "<int:pk>/",
        ClassBookingAdminDetailView.as_view(),
        name="detail",
    ),
]