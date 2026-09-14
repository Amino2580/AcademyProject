from datetime import (
    date,
    time,
)

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .availability_service import (
    get_day_for_date,
    get_week_start,
)
from .models import (
    ClassBooking,
    WeeklyAvailability,
)


class FridayAvailabilityTests(
    APITestCase
):
    friday_date = date(2026, 9, 4)

    def get_unavailable_slots(self):
        response = self.client.get(
            reverse(
                "schedule:availability"
            ),
            {
                "weekStart": (
                    get_week_start(
                        self.friday_date
                    ).isoformat()
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

    def test_friday_maps_to_friday_choice(
        self,
    ):
        self.assertEqual(
            get_day_for_date(
                self.friday_date
            ),
            ClassBooking.Weekday.FRIDAY,
        )

    def test_friday_is_closed_by_default(
        self,
    ):
        self.assertIn(
            (
                ClassBooking.Weekday.FRIDAY,
                "08:00",
            ),
            self.get_unavailable_slots(),
        )

    def test_teacher_can_enable_friday(
        self,
    ):
        WeeklyAvailability.objects.create(
            day=(
                ClassBooking
                .Weekday
                .FRIDAY
            ),
            start_time=time(7, 0),
            end_time=time(19, 30),
        )

        self.assertNotIn(
            (
                ClassBooking.Weekday.FRIDAY,
                "08:00",
            ),
            self.get_unavailable_slots(),
        )
