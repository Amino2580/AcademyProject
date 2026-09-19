from datetime import (
    time,
    timedelta,
)

from django.contrib.auth import (
    get_user_model,
)

from django.urls import reverse
from django.utils import timezone

from rest_framework import status
from rest_framework.test import APITestCase

from .models import (
    AvailabilityException,
    ClassBooking,
    ClassOffering,
    ClassSession,
    Enrollment,
    WeeklyAvailability,
)

from .availability_service import (
    get_day_for_date,
    get_week_start,
)
from students.models import Student


class WeeklyAvailabilityAPITests(
    APITestCase
):
    def setUp(self):
        user_model = get_user_model()

        self.admin_user = (
            user_model.objects.create_superuser(
                username="availability-admin",
                password="test-password-123",
                email="admin@example.com",
            )
        )

        self.regular_user = (
            user_model.objects.create_user(
                username="availability-user",
                password="test-password-123",
            )
        )

        self.list_url = reverse(
            "schedule_admin:"
            "availability-list-create"
        )

    def authenticate_admin(self):
        self.client.force_authenticate(
            user=self.admin_user
        )

    def test_anonymous_user_cannot_access_availability(
        self,
    ):
        response = self.client.get(
            self.list_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_regular_user_cannot_access_availability(
        self,
    ):
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

    def test_admin_can_list_default_availability(
        self,
    ):
        self.authenticate_admin()

        response = self.client.get(
            self.list_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            len(response.data),
            6,
        )

    def test_admin_can_change_weekly_hours(
        self,
    ):
        availability = (
            WeeklyAvailability.objects.get(
                day=(
                    ClassBooking
                    .Weekday
                    .MONDAY
                )
            )
        )

        detail_url = reverse(
            "schedule_admin:"
            "availability-detail",
            kwargs={
                "pk": availability.pk,
            },
        )

        self.authenticate_admin()

        response = self.client.patch(
            detail_url,
            {
                "startTime": "12:00",
                "endTime": "19:30",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        availability.refresh_from_db()

        self.assertEqual(
            availability.start_time,
            time(12, 0),
        )

        self.assertEqual(
            availability.end_time,
            time(19, 30),
        )

    def test_reject_overlapping_weekly_range(
        self,
    ):
        self.authenticate_admin()

        response = self.client.post(
            self.list_url,
            {
                "day": (
                    ClassBooking
                    .Weekday
                    .SATURDAY
                ),
                "startTime": "10:00",
                "endTime": "12:00",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )


class ClassOfferingAPITests(APITestCase):
    def setUp(self):
        user_model = get_user_model()
        self.admin_user = user_model.objects.create_superuser(
            username="offering-admin",
            password="test-password-123",
            email="admin@example.com",
        )
        self.url = reverse(
            "schedule_admin:offering-list-create"
        )

    def test_admin_can_create_group_offering(self):
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.post(
            self.url,
            {
                "day": ClassBooking.Weekday.SATURDAY,
                "classType": ClassBooking.ClassType.GROUP,
                "startTime": "10:00",
                "endTime": "11:00",
                "capacity": 4,
                "isActive": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        offering = ClassOffering.objects.get()
        self.assertEqual(offering.class_type, ClassBooking.ClassType.GROUP)
        self.assertEqual(offering.capacity, 4)
        self.assertEqual(offering.end_time, time(11, 0))

    def test_private_offering_rejects_capacity_over_one(self):
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.post(
            self.url,
            {
                "day": ClassBooking.Weekday.SUNDAY,
                "classType": ClassBooking.ClassType.PRIVATE,
                "startTime": "10:00",
                "endTime": "10:30",
                "capacity": 2,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(ClassOffering.objects.exists())


class AvailabilityExceptionAPITests(
    APITestCase
):
    def setUp(self):
        user_model = get_user_model()

        self.admin_user = (
            user_model.objects.create_superuser(
                username="exception-admin",
                password="test-password-123",
                email="admin@example.com",
            )
        )

        self.list_url = reverse(
            "schedule_admin:"
            "exception-list-create"
        )

        self.future_date = (
            timezone.localdate()
            + timedelta(days=3)
        )

        self.client.force_authenticate(
            user=self.admin_user
        )

    def test_admin_can_create_full_day_exception(
        self,
    ):
        response = self.client.post(
            self.list_url,
            {
                "date": (
                    self.future_date.isoformat()
                ),
                "startTime": None,
                "endTime": None,
                "reason": "تعطیلی کلاس‌ها",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertTrue(
            response.data["isFullDay"]
        )

        self.assertEqual(
            AvailabilityException
            .objects
            .count(),
            1,
        )

    def test_admin_can_create_timed_exception(
        self,
    ):
        response = self.client.post(
            self.list_url,
            {
                "date": (
                    self.future_date.isoformat()
                ),
                "startTime": "08:00",
                "endTime": "12:00",
                "reason": "عدم حضور صبح",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        exception = (
            AvailabilityException
            .objects
            .get()
        )

        self.assertEqual(
            exception.start_time,
            time(8, 0),
        )

        self.assertEqual(
            exception.end_time,
            time(12, 0),
        )

        self.assertFalse(
            exception.is_full_day
        )

    def test_exception_cancels_and_delete_restores_session(
        self,
    ):
        student = Student.objects.create(
            full_name="Session Student",
            phone="09121111111",
        )
        enrollment = Enrollment.objects.create(
            student=student,
            starts_on=self.future_date,
            expires_on=(
                self.future_date
                + timedelta(days=30)
            ),
        )
        booking = ClassBooking.objects.create(
            student=student,
            enrollment=enrollment,
            day=get_day_for_date(
                self.future_date
            ),
            start_time=time(9, 0),
            student_name=student.full_name,
            phone=student.phone,
        )
        session = ClassSession.objects.create(
            booking=booking,
            date=self.future_date,
            start_time=time(9, 0),
        )

        response = self.client.post(
            self.list_url,
            {
                "date": (
                    self.future_date.isoformat()
                ),
                "startTime": "08:00",
                "endTime": "12:00",
                "reason": "قرار ضروری استاد",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        session.refresh_from_db()

        self.assertEqual(
            session.status,
            ClassSession.Status.CANCELLED,
        )
        self.assertEqual(
            session.cancellation_reason,
            "قرار ضروری استاد",
        )

        detail_url = reverse(
            "schedule_admin:exception-detail",
            kwargs={"pk": response.data["id"]},
        )

        delete_response = self.client.delete(
            detail_url
        )

        self.assertEqual(
            delete_response.status_code,
            status.HTTP_204_NO_CONTENT,
        )

        session.refresh_from_db()

        self.assertEqual(
            session.status,
            ClassSession.Status.SCHEDULED,
        )
        self.assertEqual(
            session.cancellation_reason,
            "",
        )

    def test_reject_overlapping_exception(
        self,
    ):
        AvailabilityException.objects.create(
            date=self.future_date,
            start_time=time(8, 0),
            end_time=time(12, 0),
            reason="تعطیلی صبح",
        )

        response = self.client.post(
            self.list_url,
            {
                "date": (
                    self.future_date.isoformat()
                ),
                "startTime": "11:30",
                "endTime": "13:00",
                "reason": "بازه متداخل",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_reject_past_exception(
        self,
    ):
        past_date = (
            timezone.localdate()
            - timedelta(days=1)
        )

        response = self.client.post(
            self.list_url,
            {
                "date": past_date.isoformat(),
                "startTime": None,
                "endTime": None,
                "reason": "",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

class PublicAvailabilityRulesAPITests(
    APITestCase
):
    def setUp(self):
        self.url = reverse(
            "schedule:availability"
        )

        self.week_start = (
            get_week_start()
            + timedelta(days=7)
        )

    def get_unavailable_slots(self):
        response = self.client.get(
            self.url,
            {
                "weekStart": (
                    self.week_start.isoformat()
                )
            },
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        return {
            (
                item["day"],
                item["startTime"],
            )
            for item in response.data
        }

    def test_time_outside_weekly_hours_is_unavailable(
        self,
    ):
        WeeklyAvailability.objects.filter(
            day=(
                ClassBooking
                .Weekday
                .MONDAY
            )
        ).update(
            start_time=time(12, 0),
            end_time=time(19, 30),
        )

        unavailable_slots = (
            self.get_unavailable_slots()
        )

        self.assertIn(
            (
                ClassBooking
                .Weekday
                .MONDAY,
                "08:00",
            ),
            unavailable_slots,
        )

        self.assertIn(
            (
                ClassBooking
                .Weekday
                .MONDAY,
                "11:30",
            ),
            unavailable_slots,
        )

        self.assertNotIn(
            (
                ClassBooking
                .Weekday
                .MONDAY,
                "12:00",
            ),
            unavailable_slots,
        )

    def test_date_exception_is_unavailable(
        self,
    ):
        monday_date = (
            self.week_start
            + timedelta(days=2)
        )

        AvailabilityException.objects.create(
            date=monday_date,
            start_time=time(8, 0),
            end_time=time(12, 0),
            reason="عدم حضور صبح",
        )

        unavailable_slots = (
            self.get_unavailable_slots()
        )

        self.assertIn(
            (
                ClassBooking
                .Weekday
                .MONDAY,
                "08:00",
            ),
            unavailable_slots,
        )

        self.assertIn(
            (
                ClassBooking
                .Weekday
                .MONDAY,
                "11:30",
            ),
            unavailable_slots,
        )

        self.assertNotIn(
            (
                ClassBooking
                .Weekday
                .MONDAY,
                "12:00",
            ),
            unavailable_slots,
        )
