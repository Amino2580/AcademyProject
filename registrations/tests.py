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