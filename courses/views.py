from rest_framework.response import Response
from rest_framework.decorators import api_view

from django.shortcuts import render, get_object_or_404

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


@api_view(["GET", "POST"])
def course_students_api(request, pk):
    course = get_object_or_404(
        Course,
        pk=pk,
        is_active=True
    )

    if request.method == "GET":
        students = CourseStudent.objects.filter(
            course=course
        )

        serializer = CourseStudentSerializer(
            students,
            many=True
        )

        return Response(serializer.data)

    if request.method == "POST":
        national_id = request.data.get("national_id")

        if not national_id:
            return Response(
                {
                    "message": "national_id الزامی است."
                },
                status=400
            )

        # بررسی وجود کاربر در User Service
        user_data = get_user_by_national_id(national_id)

        status_data = user_data.get(
            "metaData",
            {}
        ).get(
            "status",
            {}
        )

        status_code = status_data.get("statusCode")

        if status_code != 200:
            return Response(
                user_data,
                status=status_code or 500
            )

        # پیدا کردن کلاس‌های دیگر همین دانشجو
        student_courses = Course.objects.filter(
            students__national_id=national_id,
            is_active=True
        ).exclude(
            pk=course.pk
        )

        # فقط کلاس‌های همان روز
        student_courses = student_courses.filter(
            day=course.day
        )

        # بررسی overlap زمانی
        overlapping_courses = student_courses.filter(
            start_time__lt=course.end_time,
            end_time__gt=course.start_time
        )

        if overlapping_courses.exists():
            return Response(
                {
                    "message": "دانشجو در این ساعت کلاس دیگری دارد."
                },
                status=400
            )

        # ثبت دانشجو
        student = CourseStudent.objects.create(
            course=course,
            national_id=national_id
        )

        serializer = CourseStudentSerializer(student)

        return Response(
            serializer.data,
            status=201
        )