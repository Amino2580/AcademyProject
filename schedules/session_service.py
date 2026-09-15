from datetime import timedelta

from django.db.models import Q
from django.utils import timezone

from .models import (
    AvailabilityException,
    ClassBooking,
    ClassSession,
    Enrollment,
)


DEFAULT_TERM_DURATION_DAYS = 30


PYTHON_WEEKDAYS = {
    ClassBooking.Weekday.MONDAY: 0,
    ClassBooking.Weekday.TUESDAY: 1,
    ClassBooking.Weekday.WEDNESDAY: 2,
    ClassBooking.Weekday.THURSDAY: 3,
    ClassBooking.Weekday.FRIDAY: 4,
    ClassBooking.Weekday.SATURDAY: 5,
    ClassBooking.Weekday.SUNDAY: 6,
}


def get_term_expiration_date(starts_on):
    return starts_on + timedelta(
        days=DEFAULT_TERM_DURATION_DAYS
    )


def get_first_class_date(
    day,
    start_time,
    preferred_date=None,
    reference_datetime=None,
):
    if preferred_date is not None:
        return preferred_date

    if reference_datetime is None:
        reference_datetime = (
            timezone.localtime()
        )

    reference_date = (
        reference_datetime.date()
    )
    reference_time = (
        reference_datetime.time()
        .replace(tzinfo=None)
    )

    days_until_class = (
        PYTHON_WEEKDAYS[day]
        - reference_date.weekday()
    ) % 7

    if (
        days_until_class == 0
        and start_time
        <= reference_time
    ):
        days_until_class = 7

    return reference_date + timedelta(
        days=days_until_class
    )


def get_session_dates(
    day,
    starts_on,
    expires_on,
):
    days_until_first = (
        PYTHON_WEEKDAYS[day]
        - starts_on.weekday()
    ) % 7

    session_date = starts_on + timedelta(
        days=days_until_first
    )

    while session_date < expires_on:
        yield session_date
        session_date += timedelta(days=7)


def get_reusable_enrollment(
    student,
    first_class_date,
):
    reuse_window_end = (
        first_class_date
        + timedelta(days=6)
    )

    return (
        Enrollment.objects.filter(
            student=student,
            is_active=True,
            starts_on__lte=reuse_window_end,
            expires_on__gt=first_class_date,
        )
        .order_by("starts_on")
        .first()
    )


def get_or_create_enrollment(
    student,
    first_class_date,
):
    enrollment = get_reusable_enrollment(
        student,
        first_class_date,
    )

    if enrollment is None:
        return Enrollment.objects.create(
            student=student,
            starts_on=first_class_date,
            expires_on=(
                get_term_expiration_date(
                    first_class_date
                )
            ),
        )

    if first_class_date < enrollment.starts_on:
        enrollment.starts_on = (
            first_class_date
        )
        enrollment.expires_on = (
            get_term_expiration_date(
                first_class_date
            )
        )
        enrollment.save(
            update_fields=[
                "starts_on",
                "expires_on",
                "updated_at",
            ]
        )

        for booking in (
            enrollment.weekly_bookings.all()
        ):
            sync_booking_sessions(booking)

    return enrollment


def get_matching_exception(
    session_date,
    start_time,
):
    return (
        AvailabilityException.objects
        .filter(date=session_date)
        .filter(
            Q(
                start_time__isnull=True,
                end_time__isnull=True,
            )
            | Q(
                start_time__lte=start_time,
                end_time__gt=start_time,
            )
        )
        .order_by("start_time")
        .first()
    )


def get_session_defaults(
    start_time,
    exception,
):
    if exception is None:
        return {
            "start_time": start_time,
            "status": (
                ClassSession.Status.SCHEDULED
            ),
            "cancellation_reason": "",
            "availability_exception": None,
        }

    return {
        "start_time": start_time,
        "status": ClassSession.Status.CANCELLED,
        "cancellation_reason": (
            exception.reason
            or "عدم حضور استاد"
        ),
        "availability_exception": exception,
    }


def sync_booking_sessions(booking):
    if booking.enrollment_id is None:
        return []

    enrollment = booking.enrollment

    target_dates = set(
        get_session_dates(
            booking.day,
            enrollment.starts_on,
            enrollment.expires_on,
        )
    )

    today = timezone.localdate()

    (
        booking.sessions
        .filter(date__gte=today)
        .exclude(date__in=target_dates)
        .delete()
    )

    sessions = []

    for session_date in sorted(target_dates):
        exception = get_matching_exception(
            session_date,
            booking.start_time,
        )

        defaults = get_session_defaults(
            booking.start_time,
            exception,
        )

        session, created = (
            ClassSession.objects.get_or_create(
                booking=booking,
                date=session_date,
                defaults=defaults,
            )
        )

        if not created:
            update_fields = []

            if (
                session.start_time
                != booking.start_time
            ):
                session.start_time = (
                    booking.start_time
                )
                update_fields.append(
                    "start_time"
                )

            should_refresh_status = (
                session.availability_exception_id
                is not None
                or exception is not None
            )

            if should_refresh_status:
                for field, value in (
                    defaults.items()
                ):
                    if getattr(session, field) != value:
                        setattr(session, field, value)
                        update_fields.append(field)

            if update_fields:
                session.save(
                    update_fields=[
                        *dict.fromkeys(
                            update_fields
                        ),
                        "updated_at",
                    ]
                )

        sessions.append(session)

    return sessions


def session_dates_have_conflict(
    day,
    start_time,
    starts_on,
    expires_on,
    exclude_booking=None,
):
    dates = list(
        get_session_dates(
            day,
            starts_on,
            expires_on,
        )
    )

    sessions = ClassSession.objects.filter(
        date__in=dates,
        start_time=start_time,
    )

    if exclude_booking is not None:
        sessions = sessions.exclude(
            booking=exclude_booking
        )

    if sessions.exists():
        return True

    legacy_bookings = (
        ClassBooking.objects.filter(
            enrollment__isnull=True,
            day=day,
            start_time=start_time,
        )
    )

    if exclude_booking is not None:
        legacy_bookings = (
            legacy_bookings.exclude(
                pk=exclude_booking.pk
            )
        )

    return legacy_bookings.exists()


def restore_sessions_for_exception(
    exception,
):
    (
        ClassSession.objects.filter(
            availability_exception=exception,
            status=ClassSession.Status.CANCELLED,
        )
        .update(
            status=ClassSession.Status.SCHEDULED,
            cancellation_reason="",
            availability_exception=None,
            updated_at=timezone.now(),
        )
    )


def sync_sessions_for_exception(
    exception,
):
    restore_sessions_for_exception(exception)

    sessions = ClassSession.objects.filter(
        date=exception.date,
    )

    if not exception.is_full_day:
        sessions = sessions.filter(
            start_time__gte=(
                exception.start_time
            ),
            start_time__lt=(
                exception.end_time
            ),
        )

    sessions.update(
        status=ClassSession.Status.CANCELLED,
        cancellation_reason=(
            exception.reason
            or "عدم حضور استاد"
        ),
        availability_exception=exception,
        updated_at=timezone.now(),
    )
