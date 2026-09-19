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
    ClassOffering,
    ClassSession,
    WeeklyAvailability,
    default_end_time,
)


DAY_SEQUENCE = (
    ClassBooking.Weekday.SATURDAY,
    ClassBooking.Weekday.SUNDAY,
    ClassBooking.Weekday.MONDAY,
    ClassBooking.Weekday.TUESDAY,
    ClassBooking.Weekday.WEDNESDAY,
    ClassBooking.Weekday.THURSDAY,
    ClassBooking.Weekday.FRIDAY,
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
    4: ClassBooking.Weekday.FRIDAY,
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


def intervals_overlap(
    first_start,
    first_end,
    second_start,
    second_end,
):
    return (
        first_start < second_end
        and first_end > second_start
    )


def is_interval_in_ranges(
    start_time,
    end_time,
    ranges,
):
    return any(
        range_start <= start_time
        and range_end >= end_time
        for range_start, range_end in ranges
    )


def is_interval_blocked_by_exception(
    start_time,
    end_time,
    exceptions,
):
    return any(
        exception.is_full_day
        or intervals_overlap(
            start_time,
            end_time,
            exception.start_time,
            exception.end_time,
        )
        for exception in exceptions
    )


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

    sessions = list(
        ClassSession.objects
        .select_related(
            "booking",
            "booking__offering",
        )
        .filter(
            date__gte=week_start,
            date__lte=(
                week_start
                + timedelta(days=6)
            ),
        )
    )

    legacy_bookings = list(
        ClassBooking.objects.filter(
            enrollment__isnull=True,
        )
    )

    offerings_by_day = defaultdict(list)

    for offering in (
        ClassOffering.objects.filter(
            is_active=True
        )
    ):
        offerings_by_day[offering.day].append(
            offering
        )

    week_end = (
        week_start
        + timedelta(days=6)
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
            slot_end_time = default_end_time(
                slot_time
            )

            starting_offering = next(
                (
                    offering
                    for offering in offerings_by_day[day]
                    if offering.start_time == slot_time
                ),
                None,
            )

            covering_offering = next(
                (
                    offering
                    for offering in offerings_by_day[day]
                    if (
                        offering.start_time < slot_time
                        < offering.end_time
                    )
                ),
                None,
            )

            relevant_end_time = (
                starting_offering.end_time
                if starting_offering
                else slot_end_time
            )

            direct_sessions = [
                session
                for session in sessions
                if (
                    session.date == slot_date
                    and session.booking.offering_id
                    is None
                    and intervals_overlap(
                        slot_time,
                        slot_end_time,
                        session.start_time,
                        session.end_time,
                    )
                )
            ]

            legacy_is_booked = any(
                booking.day == day
                and intervals_overlap(
                    slot_time,
                    slot_end_time,
                    booking.start_time,
                    booking.end_time,
                )
                for booking in legacy_bookings
            )

            is_booked = bool(
                direct_sessions
            ) or legacy_is_booked

            is_inside_working_hours = (
                is_interval_in_ranges(
                    slot_time,
                    relevant_end_time,
                    weekly_ranges[day],
                )
            )

            is_exception = (
                is_interval_blocked_by_exception(
                    slot_time,
                    relevant_end_time,
                    exceptions_by_date[
                        slot_date
                    ],
                )
            )

            if starting_offering is not None:
                booked_count = len({
                    session.booking_id
                    for session in sessions
                    if (
                        session.date == slot_date
                        and session.booking.offering_id
                        == starting_offering.id
                    )
                })

                is_full = (
                    booked_count
                    >= starting_offering.capacity
                )

                unavailable_slots.append(
                    {
                        "day": day,
                        "dayLabel": DAY_LABELS[day],
                        "startTime": slot_time.strftime(
                            "%H:%M"
                        ),
                        "endTime": (
                            starting_offering.end_time
                            .strftime("%H:%M")
                        ),
                        "isBooked": is_full,
                        "status": (
                            "closed"
                            if (
                                is_exception
                                or not is_inside_working_hours
                            )
                            else (
                                "booked"
                                if is_full
                                else "offering"
                            )
                        ),
                        "offeringId": (
                            starting_offering.id
                        ),
                        "classType": (
                            starting_offering.class_type
                        ),
                        "classTypeLabel": (
                            starting_offering
                            .get_class_type_display()
                        ),
                        "capacity": (
                            starting_offering.capacity
                        ),
                        "bookedCount": booked_count,
                        "remainingCapacity": max(
                            0,
                            starting_offering.capacity
                            - booked_count,
                        ),
                    }
                )
                continue

            if covering_offering is not None:
                unavailable_slots.append(
                    {
                        "day": day,
                        "dayLabel": DAY_LABELS[day],
                        "startTime": slot_time.strftime(
                            "%H:%M"
                        ),
                        "endTime": (
                            covering_offering.end_time
                            .strftime("%H:%M")
                        ),
                        "isBooked": False,
                        "status": "continuation",
                        "offeringId": (
                            covering_offering.id
                        ),
                        "classType": (
                            covering_offering.class_type
                        ),
                        "classTypeLabel": (
                            covering_offering
                            .get_class_type_display()
                        ),
                    }
                )
                continue

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
                    "isBooked": (
                        is_booked
                    ),
                    "status": (
                        "booked"
                        if is_booked
                        else "closed"
                    ),
                    "endTime": (
                        slot_end_time.strftime("%H:%M")
                    ),
                    "classType": (
                        ClassBooking.ClassType.PRIVATE
                    ),
                    "classTypeLabel": (
                        ClassBooking.ClassType.PRIVATE.label
                    ),
                }
            )

    return unavailable_slots


def is_slot_available(
    day,
    slot_time,
    requested_date=None,
    end_time=None,
    offering=None,
):
    if end_time is None:
        end_time = default_end_time(slot_time)

    if (
        day not in DAY_SEQUENCE
        or slot_time not in TIME_SLOTS
        or end_time is None
        or end_time <= slot_time
    ):
        return False

    if offering is not None and (
        not offering.is_active
        or offering.day != day
        or offering.start_time != slot_time
        or offering.end_time != end_time
    ):
        return False

    conflicting_offerings = (
        ClassOffering.objects.filter(
            is_active=True,
            day=day,
            start_time__lt=end_time,
            end_time__gt=slot_time,
        )
    )

    if offering is not None:
        conflicting_offerings = (
            conflicting_offerings.exclude(
                pk=offering.pk
            )
        )

    if conflicting_offerings.exists():
        return False

    if ClassBooking.objects.filter(
        enrollment__isnull=True,
        day=day,
        start_time__lt=end_time,
        end_time__gt=slot_time,
    ).exists():
        return False

    sessions = ClassSession.objects.filter(
        booking__day=day,
        start_time__lt=end_time,
        end_time__gt=slot_time,
    )

    if requested_date is None:
        sessions = sessions.filter(
            date__gte=timezone.localdate()
        )
    else:
        sessions = sessions.filter(
            date=requested_date
        )

    if offering is None:
        if sessions.exists():
            return False
    else:
        if sessions.exclude(
            booking__offering=offering
        ).exists():
            return False

        if requested_date is not None:
            occupied_places = (
                sessions.filter(
                    booking__offering=offering
                )
                .values("booking_id")
                .distinct()
                .count()
            )

            if occupied_places >= offering.capacity:
                return False

    is_inside_working_hours = (
        WeeklyAvailability.objects.filter(
            day=day,
            start_time__lte=slot_time,
            end_time__gte=end_time,
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
                start_time__lt=end_time,
                end_time__gt=slot_time,
            )
        )
        .exists()
    )

    return not has_exception
