from django.urls import path

from .views import (
    PublicScheduleAvailabilityView,
)


app_name = "schedule"


urlpatterns = [
    path(
        "availability/",
        PublicScheduleAvailabilityView.as_view(),
        name="availability",
    ),
]