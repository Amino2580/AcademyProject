from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import (
    check_password,
    make_password,
)
from django.test import TestCase, override_settings
from django.utils import timezone

from .models import OneTimePassword, UserProfile
from .services import (
    InvalidOTPCode,
    InvalidPhoneNumber,
    OTPAttemptsExceeded,
    OTPExpired,
    OTPRequestTooSoon,
    normalize_phone,
    request_otp,
    send_otp_code,
    verify_otp,
)


class UserProfileModelTests(TestCase):
    def test_regular_user_role(self):
        user = get_user_model().objects.create_user(
            username="09123456789",
        )

        profile = UserProfile.objects.create(
            user=user,
            phone="09123456789",
        )

        self.assertEqual(profile.role, "user")

    def test_staff_user_role(self):
        user = get_user_model().objects.create_user(
            username="09123456780",
            is_staff=True,
        )

        profile = UserProfile.objects.create(
            user=user,
            phone="09123456780",
        )

        self.assertEqual(profile.role, "admin")


class OneTimePasswordModelTests(TestCase):
    def test_active_otp_is_not_expired(self):
        otp = OneTimePassword.objects.create(
            phone="09123456789",
            code_hash=make_password("123456"),
            expires_at=timezone.now()
            + timedelta(minutes=2),
        )

        self.assertFalse(otp.is_expired())

    def test_expired_otp_is_expired(self):
        otp = OneTimePassword.objects.create(
            phone="09123456789",
            code_hash=make_password("123456"),
            expires_at=timezone.now()
            - timedelta(seconds=1),
        )

        self.assertTrue(otp.is_expired())


@override_settings(
    OTP_DELIVERY_BACKEND="console",
    OTP_EXPIRY_SECONDS=120,
    OTP_RESEND_COOLDOWN_SECONDS=60,
    OTP_MAX_ATTEMPTS=5,
)
class OTPServiceTests(TestCase):
    def create_otp(
        self,
        code="123456",
        expires_in=120,
        attempts=0,
    ):
        return OneTimePassword.objects.create(
            phone="09123456789",
            code_hash=make_password(code),
            expires_at=timezone.now()
            + timedelta(seconds=expires_in),
            attempts=attempts,
        )

    def test_normalize_persian_phone_number(self):
        phone = normalize_phone(
            "۰۹۱۲۳۴۵۶۷۸۹"
        )

        self.assertEqual(
            phone,
            "09123456789",
        )

    def test_reject_invalid_phone_number(self):
        with self.assertRaises(InvalidPhoneNumber):
            normalize_phone("123")

    @patch("accounts.services.send_otp_code")
    @patch(
        "accounts.services.generate_otp_code",
        return_value="123456",
    )
    def test_request_otp_stores_hashed_code(
        self,
        mock_generate,
        mock_send,
    ):
        otp = request_otp("+989123456789")

        self.assertEqual(
            otp.phone,
            "09123456789",
        )

        self.assertNotEqual(
            otp.code_hash,
            "123456",
        )

        self.assertTrue(
            check_password(
                "123456",
                otp.code_hash,
            )
        )

        mock_generate.assert_called_once_with()

        mock_send.assert_called_once_with(
            "09123456789",
            "123456",
        )

    @patch("accounts.services.send_otp_code")
    @patch(
        "accounts.services.generate_otp_code",
        return_value="123456",
    )
    def test_otp_resend_cooldown(
        self,
        mock_generate,
        mock_send,
    ):
        request_otp("09123456789")

        with self.assertRaises(OTPRequestTooSoon):
            request_otp("09123456789")

        self.assertEqual(
            OneTimePassword.objects.count(),
            1,
        )

        mock_generate.assert_called_once_with()
        mock_send.assert_called_once()

    def test_verify_correct_otp(self):
        otp = self.create_otp()

        verified_otp = verify_otp(
            "09123456789",
            "123456",
        )

        otp.refresh_from_db()

        self.assertEqual(
            verified_otp.pk,
            otp.pk,
        )
        self.assertTrue(otp.is_used)
        self.assertEqual(otp.attempts, 1)

    def test_invalid_otp_increases_attempts(self):
        otp = self.create_otp()

        with self.assertRaises(InvalidOTPCode):
            verify_otp(
                "09123456789",
                "654321",
            )

        otp.refresh_from_db()

        self.assertEqual(otp.attempts, 1)
        self.assertFalse(otp.is_used)

    def test_expired_otp_is_rejected(self):
        otp = self.create_otp(
            expires_in=-1,
        )

        with self.assertRaises(OTPExpired):
            verify_otp(
                "09123456789",
                "123456",
            )

        otp.refresh_from_db()

        self.assertTrue(otp.is_used)

    def test_maximum_attempts_disables_otp(self):
        otp = self.create_otp(
            attempts=4,
        )

        with self.assertRaises(
            OTPAttemptsExceeded
        ):
            verify_otp(
                "09123456789",
                "654321",
            )

        otp.refresh_from_db()

        self.assertEqual(otp.attempts, 5)
        self.assertTrue(otp.is_used)

    @override_settings(
        OTP_DELIVERY_BACKEND="kavenegar",
        KAVENEGAR_API_KEY="test-api-key",
        KAVENEGAR_VERIFY_TEMPLATE="academy-login",
    )
    @patch("accounts.services.requests.post")
    def test_send_otp_with_kavenegar(
        self,
        mock_post,
    ):
        mock_response = mock_post.return_value

        mock_response.json.return_value = {
            "return": {
                "status": 200,
                "message": "OK",
            }
        }

        send_otp_code(
            "09123456789",
            "123456",
        )

        mock_response.raise_for_status.assert_called_once()

        request_data = mock_post.call_args.kwargs["data"]

        self.assertEqual(
            request_data["receptor"],
            "09123456789",
        )
        self.assertEqual(
            request_data["token"],
            "123456",
        )


@override_settings(
    OTP_DELIVERY_BACKEND="console",
    OTP_EXPIRY_SECONDS=120,
    OTP_RESEND_COOLDOWN_SECONDS=60,
    OTP_MAX_ATTEMPTS=5,
)
class OTPAuthenticationAPITests(APITestCase):
    def setUp(self):
        self.phone = "09123456789"
        self.code = "123456"

        self.request_url = reverse(
            "accounts:otp-request"
        )
        self.verify_url = reverse(
            "accounts:otp-verify"
        )
        self.refresh_url = reverse(
            "accounts:token-refresh"
        )
        self.me_url = reverse(
            "accounts:current-user"
        )

    def create_valid_otp(
        self,
        phone=None,
        code=None,
    ):
        return OneTimePassword.objects.create(
            phone=phone or self.phone,
            code_hash=make_password(
                code or self.code
            ),
            expires_at=timezone.now()
            + timedelta(minutes=2),
        )

    @patch("accounts.services.send_otp_code")
    @patch(
        "accounts.services.generate_otp_code",
        return_value="123456",
    )
    def test_request_otp_api(
        self,
        mock_generate,
        mock_send,
    ):
        response = self.client.post(
            self.request_url,
            {"phone": "+989123456789"},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        otp = OneTimePassword.objects.get()

        self.assertEqual(
            otp.phone,
            self.phone,
        )
        self.assertTrue(
            check_password(
                self.code,
                otp.code_hash,
            )
        )

        self.assertEqual(
            response.data["expiresIn"],
            120,
        )

        mock_generate.assert_called_once_with()

        mock_send.assert_called_once_with(
            self.phone,
            self.code,
        )

    def test_verify_otp_returns_jwt_and_user(self):
        self.create_valid_otp()

        response = self.client.post(
            self.verify_url,
            {
                "phone": self.phone,
                "code": self.code,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

        self.assertEqual(
            response.data["user"]["phone"],
            self.phone,
        )
        self.assertEqual(
            response.data["user"]["role"],
            "user",
        )

        profile = UserProfile.objects.get(
            phone=self.phone
        )

        self.assertFalse(
            profile.user.has_usable_password()
        )
        self.assertIsNotNone(
            profile.phone_verified_at
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=(
                f"Bearer {response.data['access']}"
            )
        )

        me_response = self.client.get(
            self.me_url
        )

        self.assertEqual(
            me_response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            me_response.data["phone"],
            self.phone,
        )
        self.assertEqual(
            me_response.data["role"],
            "user",
        )

    def test_existing_staff_user_gets_admin_role(self):
        admin_user = (
            get_user_model().objects.create_user(
                username="admin-user",
                is_staff=True,
            )
        )

        UserProfile.objects.create(
            user=admin_user,
            phone=self.phone,
        )

        self.create_valid_otp()

        response = self.client.post(
            self.verify_url,
            {
                "phone": self.phone,
                "code": self.code,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            response.data["user"]["role"],
            "admin",
        )

    def test_refresh_token_returns_new_access(self):
        self.create_valid_otp()

        login_response = self.client.post(
            self.verify_url,
            {
                "phone": self.phone,
                "code": self.code,
            },
            format="json",
        )

        refresh_response = self.client.post(
            self.refresh_url,
            {
                "refresh": (
                    login_response.data["refresh"]
                )
            },
            format="json",
        )

        self.assertEqual(
            refresh_response.status_code,
            status.HTTP_200_OK,
        )
        self.assertIn(
            "access",
            refresh_response.data,
        )
        self.assertIn(
            "refresh",
            refresh_response.data,
        )

    def test_invalid_otp_is_rejected(self):
        self.create_valid_otp()

        response = self.client.post(
            self.verify_url,
            {
                "phone": self.phone,
                "code": "654321",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_anonymous_user_cannot_access_me(self):
        response = self.client.get(
            self.me_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )