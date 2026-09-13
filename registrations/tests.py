from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from datetime import time

from schedules.models import ClassBooking

from students.models import Student

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
    def test_create_registration_with_preferred_slot(
        self
    ):
        response = self.client.post(
            self.url,
             {
                "fullName": "Schedule User",
                "phone": "09121111111",
                "preferredDay": "saturday",
                "preferredTime": "09:00",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        registration = (
            RegistrationRequest.objects.get()
        )

        self.assertEqual(
            registration.preferred_day,
            "saturday",
        )

        self.assertEqual(
            registration.preferred_time,
            time(9, 0),
        )

        self.assertEqual(
            response.data["preferredDay"],
            "saturday",
        )

        self.assertEqual(
            response.data["preferredTime"],
            "09:00",
        )

    def test_reject_incomplete_preferred_slot(
        self
    ):
        response = self.client.post(
            self.url,
            {
                "fullName": "Incomplete User",
                "phone": "09122222222",
                "preferredDay": "sunday",
            },
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

    def test_reject_preferred_slot_when_booked(
        self
    ):
        ClassBooking.objects.create(
            day=ClassBooking.Weekday.MONDAY,
            start_time=time(10, 0),
            student_name="Existing Student",
            phone="09123333333",
            instrument="piano",
        )

        response = self.client.post(
            self.url,
            {
                "fullName": "New Applicant",
                "phone": "09124444444",
                "preferredDay": "monday",
                "preferredTime": "10:00",
            },
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

    def test_approving_registration_creates_student(self):
        self.client.force_authenticate(
            user=self.admin_user
        )

        response = self.client.patch(
            self.detail_url,
            {
                "status": (
                    RegistrationRequest.Status.APPROVED
                ),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            Student.objects.count(),
            1,
        )

        student = Student.objects.get(
            phone=self.registration.phone
        )

        self.assertEqual(
            student.full_name,
            self.registration.full_name,
        )

        self.assertEqual(
            student.age,
            self.registration.age,
        )

        self.assertEqual(
            student.level,
            self.registration.level,
        )

        self.assertTrue(
            student.is_active
        )

    def test_approving_registration_reuses_inactive_student(
        self
    ):
        existing_student = Student.objects.create(
            full_name="Existing Student",
            phone=self.registration.phone,
            age=None,
            level="",
            is_active=False,
        )

        self.client.force_authenticate(
            user=self.admin_user
        )

        response = self.client.patch(
            self.detail_url,
            {
                "status": (
                    RegistrationRequest.Status.APPROVED
                ),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            Student.objects.count(),
            1,
        )

        existing_student.refresh_from_db()

        self.assertTrue(
            existing_student.is_active
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

        self.assertEqual(
            Student.objects.count(),
            0,
        )
    def test_approving_scheduled_registration_creates_booking(
            self
        ):
            self.registration.preferred_day = (
                RegistrationRequest
                .PreferredDay
                .SATURDAY
            )

            self.registration.preferred_time = time(
                7,
                30,
            )

            self.registration.save(
                update_fields=[
                    "preferred_day",
                    "preferred_time",
                ]
            )

            self.client.force_authenticate(
                user=self.admin_user
            )

            response = self.client.patch(
                self.detail_url,
                {
                    "status": (
                        RegistrationRequest
                        .Status
                        .APPROVED
                    ),
                },
                format="json",
            )

            self.assertEqual(
                response.status_code,
                status.HTTP_200_OK,
            )

            booking = ClassBooking.objects.get(
                day=(
                    RegistrationRequest
                    .PreferredDay
                    .SATURDAY
                ),
                start_time=time(7, 30),
            )

            self.assertEqual(
                booking.phone,
                self.registration.phone,
            )

            self.assertEqual(
                booking.student_name,
                self.registration.full_name,
            )

            self.assertEqual(
                booking.instrument,
                self.registration.instrument,
            )

            self.assertEqual(
                booking.student.phone,
                self.registration.phone,
            )


    def test_cannot_approve_taken_time_slot(
        self
    ):
        self.registration.preferred_day = (
            RegistrationRequest
            .PreferredDay
            .SATURDAY
        )

        self.registration.preferred_time = time(
            7,
            30,
        )

        self.registration.save(
            update_fields=[
                "preferred_day",
                "preferred_time",
            ]
        )

        ClassBooking.objects.create(
            day=ClassBooking.Weekday.SATURDAY,
            start_time=time(7, 30),
            student_name="Other Student",
            phone="09120000001",
            instrument="piano",
            notes="",
        )

        self.client.force_authenticate(
            user=self.admin_user
        )

        response = self.client.patch(
            self.detail_url,
            {
                "status": (
                    RegistrationRequest
                    .Status
                    .APPROVED
                ),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.registration.refresh_from_db()

        self.assertEqual(
            self.registration.status,
            RegistrationRequest.Status.NEW,
        )

        self.assertFalse(
            Student.objects.filter(
                phone=self.registration.phone,
            ).exists()
        )