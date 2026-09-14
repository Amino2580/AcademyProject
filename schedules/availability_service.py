from collections import defaultdict
from datetime import (
    time,
    timedelta,
)

from django.db.models import Q
from django.utils import timezone

from .models import (
    AvailabilityException,
    ClassBooking,
    WeeklyAvailability,
)


DAY_SEQUENCE = (
    ClassBooking.Weekday.SATURDAY,
    ClassBooking.Weekday.SUNDAY,
    ClassBooking.Weekday.MONDAY,
    ClassBooking.Weekday.TUESDAY,
    ClassBooking.Weekday.WEDNESDAY,
    ClassBooking.Weekday.THURSDAY,
)

DAY_LABELS = dict(
    ClassBooking.Weekday.choices
)

DAY_OFFSETS = {
    day: index
    for index, day in enumerate(
        DAY_SEQUENCE
    )
}

DAY_BY_PYTHON_WEEKDAY = {
    5: ClassBooking.Weekday.SATURDAY,
    6: ClassBooking.Weekday.SUNDAY,
    0: ClassBooking.Weekday.MONDAY,
    1: ClassBooking.Weekday.TUESDAY,
    2: ClassBooking.Weekday.WEDNESDAY,
    3: ClassBooking.Weekday.THURSDAY,
}


TIME_SLOTS = tuple(
    time(
        hour=total_minutes // 60,
        minute=total_minutes % 60,
    )
    for total_minutes in range(
        7 * 60,
        19 * 60 + 1,
        30,
    )
)


def get_week_start(
    reference_date=None,
):
    if reference_date is None:
        reference_date = (
            timezone.localdate()
        )

    days_since_saturday = (
        reference_date.weekday() - 5
    ) % 7

    return (
        reference_date
        - timedelta(
            days=days_since_saturday
        )
    )


def get_day_for_date(
    requested_date,
):
    return DAY_BY_PYTHON_WEEKDAY.get(
        requested_date.weekday()
    )


def is_time_in_ranges(
    slot_time,
    ranges,
):
    return any(
        start_time
        <= slot_time
        < end_time
        for (
            start_time,
            end_time,
        ) in ranges
    )


def is_time_blocked_by_exception(
    slot_time,
    exceptions,
):
    for exception in exceptions:
        if exception.is_full_day:
            return True

        if (
            exception.start_time
            <= slot_time
            < exception.end_time
        ):
            return True

    return False


def get_public_unavailable_slots(
    week_start=None,
):
    if week_start is None:
        week_start = get_week_start()

    weekly_ranges = defaultdict(list)

    for availability in (
        WeeklyAvailability.objects.all()
    ):
        weekly_ranges[
            availability.day
        ].append(
            (
                availability.start_time,
                availability.end_time,
            )
        )

    booked_slots = set(
        ClassBooking.objects.values_list(
            "day",
            "start_time",
        )
    )

    week_end = (
        week_start
        + timedelta(days=5)
    )

    exceptions_by_date = defaultdict(
        list
    )

    exceptions = (
        AvailabilityException.objects
        .filter(
            date__gte=week_start,
            date__lte=week_end,
        )
    )

    for exception in exceptions:
        exceptions_by_date[
            exception.date
        ].append(exception)

    unavailable_slots = []

    for day in DAY_SEQUENCE:
        slot_date = (
            week_start
            + timedelta(
                days=DAY_OFFSETS[day]
            )
        )

        for slot_time in TIME_SLOTS:
            is_booked = (
                day,
                slot_time,
            ) in booked_slots

            is_inside_working_hours = (
                is_time_in_ranges(
                    slot_time,
                    weekly_ranges[day],
                )
            )

            is_exception = (
                is_time_blocked_by_exception(
                    slot_time,
                    exceptions_by_date[
                        slot_date
                    ],
                )
            )

            if (
                not is_booked
                and is_inside_working_hours
                and not is_exception
            ):
                continue

            unavailable_slots.append(
                {
                    "day": day,
                    "dayLabel": (
                        DAY_LABELS[day]
                    ),
                    "startTime": (
                        slot_time.strftime(
                            "%H:%M"
                        )
                    ),
                    "isBooked": True,
                }
            )

    return unavailable_slots


def is_slot_available(
    day,
    slot_time,
    requested_date=None,
):
    if (
        day not in DAY_SEQUENCE
        or slot_time not in TIME_SLOTS
    ):
        return False

    if ClassBooking.objects.filter(
        day=day,
        start_time=slot_time,
    ).exists():
        return False

    is_inside_working_hours = (
        WeeklyAvailability.objects.filter(
            day=day,
            start_time__lte=slot_time,
            end_time__gt=slot_time,
        ).exists()
    )

    if not is_inside_working_hours:
        return False

    if requested_date is None:
        return True

    if (
        get_day_for_date(
            requested_date
        )
        != day
    ):
        return False

    has_exception = (
        AvailabilityException.objects
        .filter(
            date=requested_date
        )
        .filter(
            Q(
                start_time__isnull=True,
                end_time__isnull=True,
            )
            | Q(
                start_time__lte=slot_time,
                end_time__gt=slot_time,
            )
        )
        .exists()
    )

    return not has_exception