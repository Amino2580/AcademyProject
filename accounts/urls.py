from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CurrentUserView,
    LogoutView,
    OTPRequestView,
    OTPVerifyView,
)


app_name = "accounts"


urlpatterns = [
    path(
        "otp/request/",
        OTPRequestView.as_view(),
        name="otp-request",
    ),
    path(
        "otp/verify/",
        OTPVerifyView.as_view(),
        name="otp-verify",
    ),
    path(
        "token/refresh/",
        TokenRefreshView.as_view(),
        name="token-refresh",
    ),
    path(
        "logout/",
        LogoutView.as_view(),
        name="logout",
    ),
    path(
        "me/",
        CurrentUserView.as_view(),
        name="current-user",
    ),
]