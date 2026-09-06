from django.urls import path

from .views import (
    RegistrationRequestAdminDetailView,
    RegistrationRequestAdminListView,
)


app_name = "registration_admin"

urlpatterns = [
    path(
        "",
        RegistrationRequestAdminListView.as_view(),
        name="list",
    ),
    path(
        "<int:pk>/",
        RegistrationRequestAdminDetailView.as_view(),
        name="detail",
    ),
]