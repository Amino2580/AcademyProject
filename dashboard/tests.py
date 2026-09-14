from datetime import date, datetime, time
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from registrations.models import RegistrationRequest
from schedules.models import ClassBooking
from students.models import Student


class AdminDashboardAPITests(APITestCase):
    def setUp(self):
        user_model = get_user_model()

        self.regular_user = (
            user_model.objects.create_user(
                username="regular-dashboard-user",
                password="test-password-123",
            )
        )

        self.admin_user = (
            user_model.objects.create_superuser(
                username="dashboard-admin",
                password="test-password-123",
                email="dashboard@example.com",
            )
        )

        self.url = reverse(
            "dashboard:summary"
        )

    def test_anonymous_user_cannot_access_dashboard(self):
        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_regular_user_cannot_access_dashboard(self):
        self.client.force_authenticate(
            user=self.regular_user
        )

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    @patch(
        "dashboard.views.timezone.localdate",
        return_value=date(2026, 9, 5),
    )
    def test_admin_receives_real_dashboard_data(
        self,
        mocked_localdate,
    ):
        Student.objects.create(
            full_name="Active Student",
            phone="09111111111",
            age=20,
            level="beginner",
            is_active=True,
        )

        Student.objects.create(
            full_name="Inactive Student",
            phone="09222222222",
            age=25,
            level="intermediate",
            is_active=False,
        )

        RegistrationRequest.objects.create(
            full_name="New Registration",
            phone="09333333333",
            age=18,
            level="beginner",
            instrument="piano",
            class_type="private",
            message="New request",
            status=(
                RegistrationRequest.Status.NEW
            ),
        )

        RegistrationRequest.objects.create(
            full_name="Contacted Registration",
            phone="09444444444",
            age=30,
            level="advanced",
            instrument="piano",
            class_type="online",
            message="Contacted request",
            status=(
                RegistrationRequest.Status.CONTACTED
            ),
        )

        ClassBooking.objects.create(
            day=ClassBooking.Weekday.SATURDAY,
            start_time=time(10, 0),
            student_name="Saturday Student",
            phone="09555555555",
            instrument="piano",
        )

        ClassBooking.objects.create(
            day=ClassBooking.Weekday.SUNDAY,
            start_time=time(11, 0),
            student_name="Sunday Student",
            phone="09666666666",
            instrument="piano",
        )

        self.client.force_authenticate(
            user=self.admin_user
        )

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["totalStudents"],
            1,
        )

        self.assertEqual(
            response.data["activeClasses"],
            2,
        )

        self.assertEqual(
            response.data["newRegistrations"],
            1,
        )

        self.assertEqual(
            response.data["todayClasses"],
            1,
        )

        self.assertEqual(
            len(response.data["todaySchedule"]),
            1,
        )

        self.assertEqual(
            len(response.data["recentRegistrations"]),
            2,
        )

        mocked_localdate.assert_called_once()

    def test_today_schedule_is_sorted_and_marks_next_class(
        self,
    ):
        ClassBooking.objects.create(
            day=ClassBooking.Weekday.SATURDAY,
            start_time=time(9, 0),
            student_name="Past Student",
            phone="09111111111",
            instrument="پیانو",
        )

        next_booking = ClassBooking.objects.create(
            day=ClassBooking.Weekday.SATURDAY,
            start_time=time(11, 0),
            student_name="Next Student",
            phone="09222222222",
            instrument="پیانو",
        )

        ClassBooking.objects.create(
            day=ClassBooking.Weekday.SATURDAY,
            start_time=time(14, 30),
            student_name="Later Student",
            phone="09333333333",
            instrument="پیانو",
        )

        ClassBooking.objects.create(
            day=ClassBooking.Weekday.SUNDAY,
            start_time=time(10, 0),
            student_name="Other Day Student",
            phone="09444444444",
            instrument="پیانو",
        )

        current_datetime = timezone.make_aware(
            datetime(2026, 9, 5, 10, 30)
        )

        self.client.force_authenticate(
            user=self.admin_user
        )

        with (
            patch(
                "dashboard.views.timezone.localdate",
                return_value=date(2026, 9, 5),
            ),
            patch(
                "dashboard.views.timezone.localtime",
                return_value=current_datetime,
            ),
        ):
            response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        today_schedule = response.data[
            "todaySchedule"
        ]

        self.assertEqual(
            [
                item["startTime"]
                for item in today_schedule
            ],
            ["09:00", "11:00", "14:30"],
        )

        self.assertEqual(
            [
                item["status"]
                for item in today_schedule
            ],
            ["passed", "next", "upcoming"],
        )

        self.assertEqual(
            today_schedule[1]["id"],
            next_booking.id,
        )

        self.assertEqual(
            today_schedule[1]["studentName"],
            "Next Student",
        )

    @patch(
        "dashboard.views.timezone.localdate",
        return_value=date(2026, 9, 4),
    )
    def test_friday_has_empty_today_schedule(
        self,
        mocked_localdate,
    ):
        ClassBooking.objects.create(
            day=ClassBooking.Weekday.SATURDAY,
            start_time=time(9, 0),
            student_name="Saturday Student",
            phone="09111111111",
            instrument="پیانو",
        )

        self.client.force_authenticate(
            user=self.admin_user
        )

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["todayClasses"],
            0,
        )

        self.assertEqual(
            response.data["todaySchedule"],
            [],
        )

        mocked_localdate.assert_called_once()