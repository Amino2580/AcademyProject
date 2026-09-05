from django.urls import path

from .views import RegistrationRequestCreateView


app_name = "registrations"

urlpatterns = [
    path(
        "",
        RegistrationRequestCreateView.as_view(),
        name="registration-request-create",
    ),
]