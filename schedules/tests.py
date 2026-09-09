from datetime import time

from django.contrib.auth import get_user_model
from django.urls import reverse

from rest_framework import status
from rest_framework.test import APITestCase

from .models import ClassBooking


class ClassBookingAdminAPITests(APITestCase):
    def setUp(self):
        user_model = get_user_model()

        self.regular_user = (
            user_model.objects.create_user(
                username="schedule-user",
                password="test-password-123",
            )
        )

        self.admin_user = (
            user_model.objects.create_superuser(
                username="schedule-admin",
                password="test-password-123",
                email="admin@example.com",
            )
        )

        self.list_url = reverse(
            "schedule_admin:list-create"
        )

        self.payload = {
            "day": "saturday",
            "startTime": "09:00",
            "name": "Test Student",
            "phone": "09120000000",
            "instrument": "piano",
            "notes": "Test booking",
        }


    def authenticate_admin(self):
        self.client.force_authenticate(
            user=self.admin_user
        )


    def create_booking(self):
        return ClassBooking.objects.create(
            day=ClassBooking.Weekday.SATURDAY,
            start_time=time(9, 0),
            student_name="Test Student",
            phone="09120000000",
            instrument="piano",
            notes="Test booking",
        )


    def test_anonymous_user_cannot_access_schedule(self):
        response = self.client.get(
            self.list_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )


    def test_regular_user_cannot_access_schedule(self):
        self.client.force_authenticate(
            user=self.regular_user
        )

        response = self.client.get(
            self.list_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )


    def test_admin_can_create_booking(self):
        self.authenticate_admin()

        response = self.client.post(
            self.list_url,
            self.payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertEqual(
            ClassBooking.objects.count(),
            1,
        )

        self.assertEqual(
            response.data["dayLabel"],
            "شنبه",
        )

        self.assertEqual(
            response.data["startTime"],
            "09:00",
        )


    def test_admin_receives_unpaginated_booking_list(self):
        self.create_booking()
        self.authenticate_admin()

        response = self.client.get(
            self.list_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertIsInstance(
            response.data,
            list,
        )

        self.assertEqual(
            len(response.data),
            1,
        )


    def test_reject_invalid_phone(self):
        self.authenticate_admin()

        payload = {
            **self.payload,
            "phone": "123",
        }

        response = self.client.post(
            self.list_url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )


    def test_reject_invalid_time_interval(self):
        self.authenticate_admin()

        payload = {
            **self.payload,
            "startTime": "09:15",
        }

        response = self.client.post(
            self.list_url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )


    def test_reject_duplicate_booking_slot(self):
        self.create_booking()
        self.authenticate_admin()

        payload = {
            **self.payload,
            "name": "Another Student",
            "phone": "09120000001",
        }

        response = self.client.post(
            self.list_url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertEqual(
            ClassBooking.objects.count(),
            1,
        )


    def test_admin_can_update_booking(self):
        booking = self.create_booking()
        self.authenticate_admin()

        detail_url = reverse(
            "schedule_admin:detail",
            kwargs={
                "pk": booking.pk,
            },
        )

        response = self.client.patch(
            detail_url,
            {
                "name": "Updated Student",
                "instrument": "keyboard",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        booking.refresh_from_db()

        self.assertEqual(
            booking.student_name,
            "Updated Student",
        )

        self.assertEqual(
            booking.instrument,
            "keyboard",
        )


    def test_admin_can_delete_booking(self):
        booking = self.create_booking()
        self.authenticate_admin()

        detail_url = reverse(
            "schedule_admin:detail",
            kwargs={
                "pk": booking.pk,
            },
        )

        response = self.client.delete(
            detail_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT,
        )

        self.assertEqual(
            ClassBooking.objects.count(),
            0,
        )