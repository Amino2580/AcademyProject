from django.urls import path

from .views import (
    MyScheduleListView,
    PublicScheduleAvailabilityView,
)


app_name = "schedule"


urlpatterns = [
    path(
        "availability/",
        PublicScheduleAvailabilityView.as_view(),
        name="availability",
    ),
    path(
        "mine/",
        MyScheduleListView.as_view(),
        name="mine",
    ),
]