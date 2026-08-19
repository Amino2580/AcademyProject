import logging
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.shortcuts import render, get_object_or_404
from django.core.exceptions import ObjectDoesNotExist
from requests.exceptions import RequestException, Timeout
from .models import Course, CourseStudent
from .serializers import CourseSerializer, CourseStudentSerializer
from .services import get_user_by_national_id



def course_list(request):
    courses = Course.objects.filter(is_active=True)

    context = {
        "courses": courses,
    }

    return render(
        request,
        "courses/course_list.html",
        context
    )


def course_detail(request, pk):
    course = get_object_or_404(
        Course,
        pk=pk,
        is_active=True
    )

    context = {
        "course": course,
    }

    return render(
        request,
        "courses/course_detail.html",
        context
    )


@api_view(["GET", "POST"])
def course_api_list(request):
    if request.method == "GET":
        courses = Course.objects.filter(is_active=True)

        serializer = CourseSerializer(
            courses,
            many=True
        )

        return Response(serializer.data)

    if request.method == "POST":
        serializer = CourseSerializer(
            data=request.data
        )

        if serializer.is_valid():
            serializer.save()

            return Response(
                serializer.data,
                status=201
            )

        return Response(
            serializer.errors,
            status=400
        )


@api_view(["GET", "PATCH", "DELETE"])
def course_api_detail(request, pk):
    course = get_object_or_404(
        Course,
        pk=pk,
        is_active=True
    )

    if request.method == "GET":
        serializer = CourseSerializer(course)
        return Response(serializer.data)

    if request.method == "PATCH":
        serializer = CourseSerializer(
            course,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(
            serializer.errors,
            status=400
        )

    if request.method == "DELETE":
        course.delete()
        return Response(status=204)


@api_view(["GET"])
def test_user_service(request):
    data = get_user_by_national_id(1234567890)
    return Response(data)

logger = logging.getLogger(__name__)

@api_view(["GET", "POST"])
def course_students_api(request, pk):
    # 1. پیدا کردن دوره با هندلینگ ۴۰۴ به صورت JSON
    try:
        course = Course.objects.get(pk=pk, is_active=True)
    except ObjectDoesNotExist:
        return Response(
            {"detail": "Course not found."},
            status=404
        )

    # 2. GET: لیست دانشجوهای دوره
    if request.method == "GET":
        students = CourseStudent.objects.filter(course=course)
        serializer = CourseStudentSerializer(students, many=True)
        return Response(serializer.data)

    # 3. POST: ثبت‌نام دانشجو
    if request.method == "POST":
        national_id = request.data.get("national_id")
        if not national_id:
            return Response(
                {"detail": "national_id is required."},
                status=400
            )

        # 4. دریافت اطلاعات کاربر از سرویس جاوا (با هندلینگ خطا)
        try:
            user_data = get_user_by_national_id(national_id)
        except Timeout:
            return Response(
                {"detail": "User service timeout."},
                status=504
            )
        except RequestException as e:
            logging.error(f"User service error: {e}")
            return Response(
                {"detail": "User service unavailable."},
                status=503
            )
        except Exception as e:
            logging.error(f"Unexpected error in user service: {e}")
            return Response(
                {"detail": "Internal error in user service."},
                status=500
            )

        # 5. بررسی وضعیت پاسخ سرویس
        try:
            status_code = user_data.get("metaData", {}).get("status", {}).get("statusCode")
        except AttributeError:
            return Response(
                {"detail": "Invalid response format from user service."},
                status=502
            )

        if status_code != 200:
            return Response(user_data, status=status_code or 502)

        # 6. بررسی تداخل زمانی
        student_courses = Course.objects.filter(
            students__national_id=national_id,
            is_active=True
        ).exclude(pk=course.pk).filter(day=course.day)

        overlapping = student_courses.filter(
            start_time__lt=course.end_time,
            end_time__gt=course.start_time
        )

        if overlapping.exists():
            return Response(
                {"detail": "Student has another class at this time."},
                status=400
            )

        # 7. ثبت دانشجو
        student = CourseStudent.objects.create(
            course=course,
            national_id=national_id
        )
        serializer = CourseStudentSerializer(student)
        return Response(serializer.data, status=201)