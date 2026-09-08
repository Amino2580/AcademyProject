from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import RegistrationRequest


class RegistrationRequestCreateAPITests(APITestCase):
    def setUp(self):
        self.url = reverse(
            "registrations:registration-request-create"
        )

    def test_create_registration_request(self):
        payload = {
            "fullName": "Test User",
            "phone": "09123456789",
            "age": 25,
            "level": "beginner",
            "instrument": "piano",
            "classType": "private",
            "message": "Test registration",
        }

        response = self.client.post(
            self.url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )
        self.assertEqual(
            RegistrationRequest.objects.count(),
            1,
        )

        registration = RegistrationRequest.objects.first()

        self.assertEqual(
            registration.full_name,
            payload["fullName"],
        )
        self.assertEqual(
            registration.phone,
            payload["phone"],
        )

    def test_reject_invalid_phone(self):
        payload = {
            "fullName": "Test User",
            "phone": "123",
            "age": 25,
            "level": "beginner",
            "instrument": "piano",
            "classType": "private",
            "message": "",
        }

        response = self.client.post(
            self.url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertEqual(
            RegistrationRequest.objects.count(),
            0,
        )


class RegistrationRequestAdminAPITests(APITestCase):
    def setUp(self):
        user_model = get_user_model()

        self.regular_user = user_model.objects.create_user(
            username="regular-user",
            password="test-password-123",
        )

        self.admin_user = user_model.objects.create_superuser(
            username="admin-user",
            password="test-password-123",
            email="admin@example.com",
        )

        self.registration = RegistrationRequest.objects.create(
            full_name="Test Student",
            phone="09123456789",
            age=25,
            level="beginner",
            instrument="piano",
            class_type="private",
            message="Test request",
        )

        self.list_url = reverse(
            "registration_admin:list"
        )

        self.detail_url = reverse(
            "registration_admin:detail",
            kwargs={"pk": self.registration.pk},
        )

    def test_anonymous_user_cannot_access_admin_list(self):
        response = self.client.get(self.list_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_regular_user_cannot_access_admin_list(self):
        self.client.force_authenticate(
            user=self.regular_user
        )

        response = self.client.get(self.list_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )
        
    def test_admin_can_access_paginated_list(self):
        self.client.force_authenticate(
            user=self.admin_user
        )

        response = self.client.get(self.list_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(
            len(response.data["results"]),
            1,
        )

    def test_admin_can_update_registration_status(self):
        self.client.force_authenticate(
            user=self.admin_user
        )

        response = self.client.patch(
            self.detail_url,
            {"status": "contacted"},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.registration.refresh_from_db()

        self.assertEqual(
            self.registration.status,
            RegistrationRequest.Status.CONTACTED,
        )