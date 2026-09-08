from datetime import timedelta

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.test import TestCase
from django.utils import timezone

from .models import OneTimePassword, UserProfile


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