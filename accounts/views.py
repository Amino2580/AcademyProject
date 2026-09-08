from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.exceptions import (
    APIException,
    NotFound,
    PermissionDenied,
    Throttled,
    ValidationError,
)
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated,
)
from rest_framework.response import Response
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .models import UserProfile
from .serializers import (
    AuthUserSerializer,
    OTPRequestResponseSerializer,
    OTPRequestSerializer,
    OTPVerifyResponseSerializer,
    OTPVerifySerializer,
    LogoutSerializer,
    MessageResponseSerializer,
)
from .services import (
    InvalidOTPCode,
    InvalidPhoneNumber,
    OTPAttemptsExceeded,
    OTPDeliveryError,
    OTPExpired,
    OTPRequestTooSoon,
    request_otp,
    verify_otp,
)


class OTPDeliveryUnavailable(APIException):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = "OTP service is unavailable."
    default_code = "otp_service_unavailable"


def get_or_create_profile(phone):
    profile = (
        UserProfile.objects
        .select_related("user")
        .filter(phone=phone)
        .first()
    )

    if profile is not None:
        return profile

    user_model = get_user_model()

    user = (
        user_model.objects
        .filter(username=phone)
        .first()
    )

    if user is None:
        user = user_model(
            username=phone,
        )

        user.set_unusable_password()
        user.save()

    existing_profile = (
        UserProfile.objects
        .filter(user=user)
        .first()
    )

    if existing_profile is not None:
        raise PermissionDenied(
            "Account phone does not match."
        )

    return UserProfile.objects.create(
        user=user,
        phone=phone,
    )


def create_auth_response(profile):
    user = profile.user

    refresh = RefreshToken.for_user(user)

    refresh["phone"] = profile.phone
    refresh["role"] = profile.role

    access = refresh.access_token

    user_data = AuthUserSerializer(
        {
            "id": user.pk,
            "phone": profile.phone,
            "role": profile.role,
        }
    ).data

    return {
        "access": str(access),
        "refresh": str(refresh),
        "user": user_data,
    }


class OTPRequestView(GenericAPIView):
    serializer_class = OTPRequestSerializer
    permission_classes = [AllowAny]

    @extend_schema(
        responses={
            status.HTTP_200_OK: (
                OTPRequestResponseSerializer
            ),
        }
    )
    def post(self, request):
        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        phone = serializer.validated_data["phone"]

        try:
            request_otp(phone)

        except InvalidPhoneNumber as exc:
            raise ValidationError(
                {"phone": str(exc)}
            ) from exc

        except OTPRequestTooSoon as exc:
            raise Throttled(
                wait=exc.retry_after,
                detail=str(exc),
            ) from exc

        except OTPDeliveryError as exc:
            raise OTPDeliveryUnavailable(
                str(exc)
            ) from exc

        response_data = {
            "message": "OTP sent successfully.",
            "expiresIn": settings.OTP_EXPIRY_SECONDS,
            "resendAfter": (
                settings.OTP_RESEND_COOLDOWN_SECONDS
            ),
        }

        return Response(
            response_data,
            status=status.HTTP_200_OK,
        )


class OTPVerifyView(GenericAPIView):
    serializer_class = OTPVerifySerializer
    permission_classes = [AllowAny]

    @extend_schema(
        responses={
            status.HTTP_200_OK: (
                OTPVerifyResponseSerializer
            ),
        }
    )
    def post(self, request):
        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        phone = serializer.validated_data["phone"]
        code = serializer.validated_data["code"]

        try:
            verify_otp(phone, code)

        except InvalidPhoneNumber as exc:
            raise ValidationError(
                {"phone": str(exc)}
            ) from exc

        except (
            InvalidOTPCode,
            OTPExpired,
            OTPAttemptsExceeded,
        ) as exc:
            raise ValidationError(
                {"code": str(exc)}
            ) from exc

        profile = get_or_create_profile(phone)
        user = profile.user

        if not user.is_active:
            raise PermissionDenied(
                "This account is inactive."
            )

        profile.phone_verified_at = timezone.now()

        profile.save(
            update_fields=(
                "phone_verified_at",
                "updated_at",
            )
        )

        response_data = create_auth_response(
            profile
        )

        return Response(
            response_data,
            status=status.HTTP_200_OK,
        )


class CurrentUserView(GenericAPIView):
    serializer_class = AuthUserSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            profile = request.user.profile
        except UserProfile.DoesNotExist as exc:
            raise NotFound(
                "Phone profile was not found."
            ) from exc

        serializer = self.get_serializer(
            {
                "id": request.user.pk,
                "phone": profile.phone,
                "role": profile.role,
            }
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

class LogoutView(GenericAPIView):
    serializer_class = LogoutSerializer
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={
            status.HTTP_200_OK: (
                MessageResponseSerializer
            ),
        }
    )
    def post(self, request):
        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        try:
            refresh = RefreshToken(
                serializer.validated_data["refresh"]
            )

            token_user_id = refresh.get(
                "user_id"
            )

            if str(token_user_id) != str(
                request.user.pk
            ):
                raise ValidationError(
                    {
                        "refresh": (
                            "Refresh token does not belong "
                            "to the current user."
                        )
                    }
                )

            refresh.blacklist()

        except TokenError as exc:
            raise ValidationError(
                {
                    "refresh": (
                        "Invalid or expired refresh token."
                    )
                }
            ) from exc

        return Response(
            {
                "message": (
                    "Logged out successfully."
                )
            },
            status=status.HTTP_200_OK,
        )