from datetime import time, timedelta

from accounts.models import UserProfile

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone

from rest_framework import status
from rest_framework.test import APITestCase

from students.models import Student

from .availability_service import (
    get_day_for_date,
    get_week_start,
)
from .models import (
    ClassBooking,
    ClassOffering,
    ClassSession,
    Enrollment,
)


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

        self.assertEqual(
            response.data["capacity"],
            1,
        )


    def test_group_booking_requires_an_offering(self):
        self.authenticate_admin()

        response = self.client.post(
            self.list_url,
            {
                **self.payload,
                "classType": (
                    ClassBooking.ClassType.GROUP
                ),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn(
            "offeringId",
            response.data["metaData"]
            ["status"]["message"],
        )
        self.assertFalse(
            ClassBooking.objects.exists()
        )


    def test_group_offering_accepts_students_until_capacity(
        self,
    ):
        self.authenticate_admin()

        offering = ClassOffering.objects.create(
            day=ClassBooking.Weekday.SATURDAY,
            start_time=time(9, 0),
            end_time=time(9, 30),
            class_type=(
                ClassBooking.ClassType.GROUP
            ),
            capacity=2,
        )

        first_class_date = (
            get_week_start()
            + timedelta(days=7)
        )

        responses = []

        for index in range(3):
            responses.append(
                self.client.post(
                    self.list_url,
                    {
                        **self.payload,
                        "name": f"Student {index}",
                        "phone": f"0912000000{index}",
                        "offeringId": offering.id,
                        "firstClassDate": (
                            first_class_date.isoformat()
                        ),
                    },
                    format="json",
                )
            )

        self.assertEqual(
            responses[0].status_code,
            status.HTTP_201_CREATED,
        )
        self.assertEqual(
            responses[1].status_code,
            status.HTTP_201_CREATED,
        )
        self.assertEqual(
            responses[1].data["capacity"],
            2,
        )
        self.assertEqual(
            responses[2].status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertEqual(
            ClassBooking.objects.filter(
                offering=offering
            ).count(),
            2,
        )

    def test_multiple_weekly_days_share_one_month_term(
        self,
    ):
        self.authenticate_admin()

        next_saturday = (
            get_week_start()
            + timedelta(days=7)
        )

        first_response = self.client.post(
            self.list_url,
            {
                **self.payload,
                "firstClassDate": (
                    next_saturday.isoformat()
                ),
            },
            format="json",
        )

        second_response = self.client.post(
            self.list_url,
            {
                **self.payload,
                "day": "sunday",
                "startTime": "10:00",
                "firstClassDate": (
                    next_saturday
                    + timedelta(days=1)
                ).isoformat(),
            },
            format="json",
        )

        self.assertEqual(
            first_response.status_code,
            status.HTTP_201_CREATED,
        )
        self.assertEqual(
            second_response.status_code,
            status.HTTP_201_CREATED,
        )

        bookings = list(
            ClassBooking.objects
            .select_related("enrollment")
            .order_by("day")
        )

        self.assertEqual(len(bookings), 2)
        self.assertEqual(
            bookings[0].enrollment_id,
            bookings[1].enrollment_id,
        )

        enrollment = bookings[0].enrollment

        self.assertEqual(
            enrollment.starts_on,
            next_saturday,
        )
        self.assertEqual(
            enrollment.expires_on,
            next_saturday
            + timedelta(days=30),
        )
        self.assertEqual(
            set(
                ClassSession.objects
                .values_list(
                    "booking_id",
                    flat=True,
                )
            ),
            {booking.id for booking in bookings},
        )
        self.assertFalse(
            ClassSession.objects.filter(
                date__gte=enrollment.expires_on
            ).exists()
        )

    def test_expired_term_does_not_block_new_term(
        self,
    ):
        self.authenticate_admin()

        first_saturday = (
            get_week_start()
            + timedelta(days=7)
        )

        first_response = self.client.post(
            self.list_url,
            {
                **self.payload,
                "firstClassDate": (
                    first_saturday.isoformat()
                ),
            },
            format="json",
        )

        next_term_start = (
            first_saturday
            + timedelta(days=35)
        )

        second_response = self.client.post(
            self.list_url,
            {
                **self.payload,
                "name": "Next Student",
                "phone": "09120000002",
                "firstClassDate": (
                    next_term_start.isoformat()
                ),
            },
            format="json",
        )

        self.assertEqual(
            first_response.status_code,
            status.HTTP_201_CREATED,
        )
        self.assertEqual(
            second_response.status_code,
            status.HTTP_201_CREATED,
        )
        self.assertEqual(
            ClassBooking.objects.filter(
                day="saturday",
                start_time=time(9, 0),
            ).count(),
            2,
        )

        first_week_response = self.client.get(
            self.list_url,
            {
                "weekStart": (
                    first_saturday.isoformat()
                )
            },
        )
        second_week_response = self.client.get(
            self.list_url,
            {
                "weekStart": (
                    next_term_start.isoformat()
                )
            },
        )

        self.assertEqual(
            len(first_week_response.data),
            1,
        )
        self.assertEqual(
            first_week_response.data[0]["name"],
            "Test Student",
        )
        self.assertEqual(
            len(second_week_response.data),
            1,
        )
        self.assertEqual(
            second_week_response.data[0]["name"],
            "Next Student",
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


class ClassBookingStudentIntegrationTests(
    APITestCase
):
    def setUp(self):
        user_model = get_user_model()

        self.admin_user = (
            user_model.objects.create_superuser(
                username="schedule-student-admin",
                password="test-password-123",
                email="schedule-student@example.com",
            )
        )

        self.client.force_authenticate(
            user=self.admin_user
        )

        self.url = reverse(
            "schedule_admin:list-create"
        )

    def test_creating_booking_creates_student(self):
        response = self.client.post(
            self.url,
            {
                "day": "saturday",
                "startTime": "09:00",
                "name": "New Schedule Student",
                "phone": "+989123456789",
                "instrument": "piano",
                "notes": "",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertEqual(
            Student.objects.count(),
            1,
        )

        student = Student.objects.get(
            phone="09123456789"
        )

        booking = ClassBooking.objects.get()

        self.assertEqual(
            booking.student,
            student,
        )

        self.assertEqual(
            response.data["studentId"],
            student.id,
        )

    def test_booking_reuses_existing_student(self):
        existing_student = Student.objects.create(
            full_name="Existing Student",
            phone="09111111111",
            age=20,
            level="beginner",
        )

        response = self.client.post(
            self.url,
            {
                "day": "sunday",
                "startTime": "10:00",
                "name": "Existing Student",
                "phone": "09111111111",
                "instrument": "piano",
                "notes": "",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertEqual(
            Student.objects.count(),
            1,
        )

        booking = ClassBooking.objects.get()

        self.assertEqual(
            booking.student,
            existing_student,
        )

class PublicScheduleAvailabilityAPITests(
    APITestCase
):
    def setUp(self):
        self.url = reverse(
            "schedule:availability"
        )

        ClassBooking.objects.create(
            day=ClassBooking.Weekday.SATURDAY,
            start_time=time(9, 0),
            student_name="Private Student",
            phone="09123456789",
            instrument="piano",
            notes="Private notes",
        )

    def test_anonymous_user_can_view_availability(self):
        response = self.client.get(
            self.url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        slots = {
            (
                item["day"],
                item["startTime"],
            ): item
            for item in response.data
        }

        booking = slots[
            (
                "saturday",
                "09:00",
            )
        ]

        self.assertTrue(
            booking["isBooked"]
        )

        self.assertEqual(
            booking["status"],
            "booked",
        )

        closed_slot = slots[
            (
                "friday",
                "09:00",
            )
        ]

        self.assertFalse(
            closed_slot["isBooked"]
        )

        self.assertEqual(
            closed_slot["status"],
            "closed",
        )

    def test_public_api_hides_student_information(self):
        response = self.client.get(
            self.url
        )

        booking = next(
            item
            for item in response.data
            if item["isBooked"]
        )

        self.assertEqual(
            set(booking.keys()),
            {
                "day",
                "dayLabel",
                "startTime",
                "endTime",
                "classType",
                "classTypeLabel",
                "isBooked",
                "status",
            },
        )

        self.assertNotIn(
            "name",
            booking,
        )

        self.assertNotIn(
            "phone",
            booking,
        )

        self.assertNotIn(
            "notes",
            booking,
        )

    def test_public_api_exposes_class_offering_details(self):
        offering = ClassOffering.objects.create(
            day=ClassBooking.Weekday.MONDAY,
            start_time=time(10, 0),
            end_time=time(11, 0),
            class_type=ClassBooking.ClassType.GROUP,
            capacity=4,
        )

        response = self.client.get(self.url)
        slot = next(
            item
            for item in response.data
            if item.get("offeringId") == offering.id
            and item["startTime"] == "10:00"
        )

        self.assertEqual(slot["status"], "offering")
        self.assertEqual(slot["endTime"], "11:00")
        self.assertEqual(slot["classType"], "group")
        self.assertEqual(slot["classTypeLabel"], "کلاس گروهی")
        self.assertEqual(slot["remainingCapacity"], 4)

    def test_group_class_with_one_student_is_not_full(self):
        offering = ClassOffering.objects.create(
            day=ClassBooking.Weekday.MONDAY,
            start_time=time(11, 0),
            end_time=time(11, 30),
            class_type=ClassBooking.ClassType.GROUP,
            capacity=4,
        )

        session_date = (
            get_week_start()
            + timedelta(days=2)
        )
        student = Student.objects.create(
            full_name="Reza Amini",
            phone="09366542210",
        )
        enrollment = Enrollment.objects.create(
            student=student,
            starts_on=session_date,
            expires_on=(
                session_date + timedelta(days=30)
            ),
        )
        booking = ClassBooking.objects.create(
            day=offering.day,
            start_time=offering.start_time,
            end_time=offering.end_time,
            class_type=offering.class_type,
            offering=offering,
            student=student,
            enrollment=enrollment,
            student_name=student.full_name,
            phone=student.phone,
        )
        ClassSession.objects.create(
            booking=booking,
            date=session_date,
            start_time=offering.start_time,
            end_time=offering.end_time,
        )

        response = self.client.get(
            self.url,
            {
                "weekStart": (
                    get_week_start().isoformat()
                )
            },
        )
        slot = next(
            item
            for item in response.data
            if item.get("offeringId") == offering.id
        )

        self.assertFalse(slot["isBooked"])
        self.assertEqual(slot["status"], "offering")
        self.assertEqual(slot["bookedCount"], 1)
        self.assertEqual(slot["remainingCapacity"], 3)

    def test_public_api_does_not_allow_creating_booking(self):
        response = self.client.post(
            self.url,
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_405_METHOD_NOT_ALLOWED,
        )

class MyScheduleAPITests(
    APITestCase
):
    def setUp(self):
        user_model = get_user_model()

        self.user = (
            user_model.objects.create_user(
                username="09120000000",
                password="test-password-123",
            )
        )

        UserProfile.objects.create(
            user=self.user,
            phone="09120000000",
        )

        self.own_student = Student.objects.create(
            full_name="Own Student",
            phone="09120000000",
        )

        self.other_student = Student.objects.create(
            full_name="Other Student",
            phone="09120000001",
        )

        self.first_session_date = (
            timezone.localdate()
            + timedelta(days=1)
        )

        self.own_enrollment = (
            Enrollment.objects.create(
                student=self.own_student,
                starts_on=self.first_session_date,
                expires_on=(
                    self.first_session_date
                    + timedelta(days=30)
                ),
            )
        )

        self.other_enrollment = (
            Enrollment.objects.create(
                student=self.other_student,
                starts_on=self.first_session_date,
                expires_on=(
                    self.first_session_date
                    + timedelta(days=30)
                ),
            )
        )

        self.own_booking = (
            ClassBooking.objects.create(
                day=get_day_for_date(
                    self.first_session_date
                ),
                start_time=time(9, 0),
                student=self.own_student,
                enrollment=self.own_enrollment,
                student_name="Own Student",
                phone="09120000000",
                instrument="piano",
                notes="Own class",
            )
        )

        self.other_booking = (
            ClassBooking.objects.create(
                day=get_day_for_date(
                    self.first_session_date
                ),
                start_time=time(10, 0),
                student=self.other_student,
                enrollment=self.other_enrollment,
                student_name="Other Student",
                phone="09120000001",
                instrument="piano",
                notes="Other class",
            )
        )

        self.own_sessions = [
            ClassSession.objects.create(
                booking=self.own_booking,
                date=(
                    self.first_session_date
                    + timedelta(days=offset)
                ),
                start_time=time(9, 0),
            )
            for offset in (0, 7)
        ]

        self.other_session = (
            ClassSession.objects.create(
                booking=self.other_booking,
                date=self.first_session_date,
                start_time=time(10, 0),
            )
        )

        self.url = reverse(
            "schedule:mine"
        )


    def test_anonymous_user_cannot_access_my_schedule(
        self
    ):
        response = self.client.get(
            self.url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )


    def test_user_only_receives_own_classes(
        self
    ):
        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.get(
            self.url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            len(response.data),
            2,
        )

        self.assertEqual(
            response.data[0]["id"],
            self.own_sessions[0].id,
        )

        self.assertNotEqual(
            response.data[0]["id"],
            self.other_session.id,
        )

        self.assertNotIn(
            "phone",
            response.data[0],
        )

        self.assertEqual(
            response.data[0]["startTime"],
            "09:00",
        )

        self.assertEqual(
            response.data[0]["endTime"],
            "09:30",
        )

        self.assertEqual(
            response.data[0]["classType"],
            "private",
        )

        self.assertEqual(
            response.data[0]["classTypeLabel"],
            "کلاس خصوصی",
        )

        self.assertNotIn("name", response.data[0])
        self.assertNotIn("instrument", response.data[0])

        self.assertEqual(
            response.data[0]["date"],
            self.first_session_date.isoformat(),
        )

        self.assertEqual(
            response.data[0]["status"],
            ClassSession.Status.SCHEDULED,
        )

        self.assertEqual(
            response.data[0]["termExpiresOn"],
            (
                self.first_session_date
                + timedelta(days=30)
            ).isoformat(),
        )
