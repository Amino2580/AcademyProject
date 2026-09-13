from django.urls import path

from .availability_views import (
    AvailabilityExceptionDetailView,
    AvailabilityExceptionListCreateView,
    WeeklyAvailabilityDetailView,
    WeeklyAvailabilityListCreateView,
)

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
        "availability/",
        WeeklyAvailabilityListCreateView.as_view(),
        name="availability-list-create",
    ),
    path(
        "availability/<int:pk>/",
        WeeklyAvailabilityDetailView.as_view(),
        name="availability-detail",
    ),
    path(
        "exceptions/",
        AvailabilityExceptionListCreateView.as_view(),
        name="exception-list-create",
    ),
    path(
        "exceptions/<int:pk>/",
        AvailabilityExceptionDetailView.as_view(),
        name="exception-detail",
    ),
    path(
        "<int:pk>/",
        ClassBookingAdminDetailView.as_view(),
        name="detail",
    ),
]