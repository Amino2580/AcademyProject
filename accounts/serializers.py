from rest_framework import serializers

from .services import (
    InvalidPhoneNumber,
    normalize_phone,
)


class OTPRequestSerializer(serializers.Serializer):
    phone = serializers.CharField(
        max_length=20,
    )

    def validate_phone(self, value):
        try:
            return normalize_phone(value)
        except InvalidPhoneNumber as exc:
            raise serializers.ValidationError(
                str(exc)
            ) from exc


class OTPVerifySerializer(OTPRequestSerializer):
    code = serializers.CharField(
        min_length=6,
        max_length=6,
        trim_whitespace=True,
    )


class AuthUserSerializer(serializers.Serializer):
    id = serializers.IntegerField(
        read_only=True,
    )

    phone = serializers.CharField(
        read_only=True,
    )

    role = serializers.ChoiceField(
        choices=(
            "admin",
            "user",
        ),
        read_only=True,
    )


class OTPRequestResponseSerializer(serializers.Serializer):
    message = serializers.CharField(
        read_only=True,
    )

    expiresIn = serializers.IntegerField(
        read_only=True,
    )

    resendAfter = serializers.IntegerField(
        read_only=True,
    )


class OTPVerifyResponseSerializer(serializers.Serializer):
    access = serializers.CharField(
        read_only=True,
    )

    refresh = serializers.CharField(
        read_only=True,
    )

    user = AuthUserSerializer(
        read_only=True,
    )

class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField(
        write_only=True,
    )


class MessageResponseSerializer(serializers.Serializer):
    message = serializers.CharField(
        read_only=True,
    )