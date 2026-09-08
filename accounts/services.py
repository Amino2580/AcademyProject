import logging
import math
import re
import secrets
from datetime import timedelta

import requests
from django.conf import settings
from django.contrib.auth.hashers import (
    check_password,
    make_password,
)
from django.utils import timezone

from .models import OneTimePassword


logger = logging.getLogger(__name__)

DIGIT_TRANSLATION = str.maketrans(
    "۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩",
    "01234567890123456789",
)


class OTPServiceError(Exception):
    pass


class InvalidPhoneNumber(OTPServiceError):
    pass


class OTPRequestTooSoon(OTPServiceError):
    def __init__(self, retry_after):
        self.retry_after = retry_after

        super().__init__(
            f"Please wait {retry_after} seconds before retrying."
        )


class OTPDeliveryError(OTPServiceError):
    pass


class InvalidOTPCode(OTPServiceError):
    pass


class OTPExpired(OTPServiceError):
    pass


class OTPAttemptsExceeded(OTPServiceError):
    pass


def normalize_phone(value):
    phone = str(value or "").translate(
        DIGIT_TRANSLATION
    )

    phone = re.sub(
        r"[\s\-()]",
        "",
        phone.strip(),
    )

    if phone.startswith("0098"):
        phone = "0" + phone[4:]
    elif phone.startswith("+98"):
        phone = "0" + phone[3:]
    elif phone.startswith("98"):
        phone = "0" + phone[2:]
    elif re.fullmatch(r"9[0-9]{9}", phone):
        phone = "0" + phone

    if not re.fullmatch(r"09[0-9]{9}", phone):
        raise InvalidPhoneNumber(
            "Enter a valid Iranian mobile number."
        )

    return phone


def generate_otp_code():
    return f"{secrets.randbelow(900000) + 100000}"


def send_otp_code(phone, code):
    backend = settings.OTP_DELIVERY_BACKEND

    if backend == "console":
        logger.warning(
            "Development OTP for %s: %s",
            phone,
            code,
        )
        return

    if backend != "kavenegar":
        raise OTPDeliveryError(
            "Invalid OTP delivery backend."
        )

    api_key = settings.KAVENEGAR_API_KEY
    template = settings.KAVENEGAR_VERIFY_TEMPLATE

    if not api_key or not template:
        raise OTPDeliveryError(
            "Kavenegar configuration is missing."
        )

    url = (
        f"https://api.kavenegar.com/v1/"
        f"{api_key}/verify/lookup.json"
    )

    try:
        response = requests.post(
            url,
            data={
                "receptor": phone,
                "token": code,
                "template": template,
                "type": "sms",
            },
            timeout=10,
        )

        response.raise_for_status()
        response_data = response.json()

    except (requests.RequestException, ValueError) as exc:
        raise OTPDeliveryError(
            "Could not send OTP."
        ) from exc

    result = response_data.get("return", {})

    if result.get("status") != 200:
        raise OTPDeliveryError(
            result.get("message", "Could not send OTP.")
        )


def request_otp(raw_phone):
    phone = normalize_phone(raw_phone)
    now = timezone.now()

    latest_otp = (
        OneTimePassword.objects
        .filter(phone=phone)
        .order_by("-created_at")
        .first()
    )

    cooldown = settings.OTP_RESEND_COOLDOWN_SECONDS

    if latest_otp:
        elapsed = (
            now - latest_otp.created_at
        ).total_seconds()

        if elapsed < cooldown:
            retry_after = math.ceil(
                cooldown - elapsed
            )

            raise OTPRequestTooSoon(retry_after)

    code = generate_otp_code()

    otp = OneTimePassword.objects.create(
        phone=phone,
        code_hash=make_password(code),
        expires_at=now + timedelta(
            seconds=settings.OTP_EXPIRY_SECONDS
        ),
    )

    try:
        send_otp_code(phone, code)
    except Exception:
        otp.delete()
        raise

    (
        OneTimePassword.objects
        .filter(
            phone=phone,
            is_used=False,
        )
        .exclude(pk=otp.pk)
        .update(is_used=True)
    )

    return otp


def verify_otp(raw_phone, raw_code):
    phone = normalize_phone(raw_phone)

    code = str(raw_code or "").translate(
        DIGIT_TRANSLATION
    ).strip()

    if not re.fullmatch(r"[0-9]{6}", code):
        raise InvalidOTPCode(
            "Enter a valid 6-digit OTP."
        )

    otp = (
        OneTimePassword.objects
        .filter(
            phone=phone,
            is_used=False,
        )
        .order_by("-created_at")
        .first()
    )

    if otp is None:
        raise InvalidOTPCode(
            "OTP is invalid."
        )

    if otp.is_expired():
        otp.is_used = True
        otp.save(update_fields=("is_used",))

        raise OTPExpired(
            "OTP has expired."
        )

    if otp.attempts >= settings.OTP_MAX_ATTEMPTS:
        otp.is_used = True
        otp.save(update_fields=("is_used",))

        raise OTPAttemptsExceeded(
            "Maximum OTP attempts exceeded."
        )

    otp.attempts += 1

    if not check_password(code, otp.code_hash):
        if otp.attempts >= settings.OTP_MAX_ATTEMPTS:
            otp.is_used = True

            otp.save(
                update_fields=(
                    "attempts",
                    "is_used",
                )
            )

            raise OTPAttemptsExceeded(
                "Maximum OTP attempts exceeded."
            )

        otp.save(update_fields=("attempts",))

        raise InvalidOTPCode(
            "OTP is invalid."
        )

    otp.is_used = True

    otp.save(
        update_fields=(
            "attempts",
            "is_used",
        )
    )

    return otp