import logging
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.shortcuts import render, get_object_or_404
from django.core.exceptions import ObjectDoesNotExist
from django.db import IntegrityError
from requests.exceptions import RequestException, Timeout
from .models import Course, CourseStudent
from .serializers import CourseSerializer, CourseStudentSerializer
from .services import get_user_by_national_id

logger = logging.getLogger(__name__)


def course_list(request):
    courses = Course.objects.filter(is_active=True)
    context = {"courses": courses}
    return render(request, "courses/course_list.html", context)


def course_detail(request, pk):
    course = get_object_or_404(Course, pk=pk, is_active=True)
    context = {"course": course}
    return render(request, "courses/course_detail.html", context)


@api_view(["GET", "POST"])
def course_api_list(request):
    if request.method == "GET":
        courses = Course.objects.filter(is_active=True)
        serializer = CourseSerializer(courses, many=True)
        return Response(serializer.data)

    if request.method == "POST":
        serializer = CourseSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


@api_view(["GET", "PATCH", "DELETE"])
def course_api_detail(request, pk):
    try:
        course = Course.objects.get(pk=pk, is_active=True)
    except ObjectDoesNotExist:
        return Response(
            {"metaData": {"status": {"statusCode": 404, "message": "Course not found."}}},
            status=404
        )

    if request.method == "GET":
        serializer = CourseSerializer(course)
        return Response(serializer.data)

    if request.method == "PATCH":
        serializer = CourseSerializer(course, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(
            {"metaData": {"status": {"statusCode": 400, "message": str(serializer.errors)}}},
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
    try:
        course = Course.objects.get(pk=pk, is_active=True)
    except ObjectDoesNotExist:
        return Response(
            {"metaData": {"status": {"statusCode": 404, "message": "Course not found."}}},
            status=404
        )

    #   لیست دانشجوهای دوره
    if request.method == "GET":
        students = CourseStudent.objects.filter(course=course)
        serializer = CourseStudentSerializer(students, many=True)
        return Response(serializer.data)

    #  ثبت‌نام دانشجو
    if request.method == "POST":
        national_id = request.data.get("national_id")
        if not national_id:
            return Response(
                {"metaData": {"status": {"statusCode": 400, "message": "national_id is required."}}},
                status=400
            )

        try:
            user_data = get_user_by_national_id(national_id)
        except Timeout:
            logger.error("User service timeout")
            return Response(
                {"metaData": {"status": {"statusCode": 504, "message": "User service timeout."}}},
                status=504
            )
        except RequestException as e:
            logger.error(f"User service error: {e}")
            return Response(
                {"metaData": {"status": {"statusCode": 503, "message": "User service unavailable."}}},
                status=503
            )
        except Exception as e:
            logger.error(f"Unexpected error in user service: {e}", exc_info=True)
            return Response(
                {"metaData": {"status": {"statusCode": 500, "message": "Internal error in user service."}}},
                status=500
            )

        try:
            status_code = user_data.get("metaData", {}).get("status", {}).get("statusCode")
        except AttributeError:
            logger.error("Invalid response format from user service")
            return Response(
                {"metaData": {"status": {"statusCode": 502, "message": "Invalid response format from user service."}}},
                status=502
            )

        if status_code != 200:
            return Response(user_data, status=status_code or 502)

        #  بررسی تداخل زمانی
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
                {"metaData": {"status": {"statusCode": 400, "message": "Student has another class at this time."}}},
                status=400
            )

        try:
            student = CourseStudent.objects.create(
                course=course,
                national_id=national_id
            )
        except IntegrityError:
            logger.error(f"Duplicate student registration: course={course.pk}, national_id={national_id}")
            return Response(
                {"metaData": {"status": {"statusCode": 409, "message": "Student already registered in this course."}}},
                status=409
            )

        serializer = CourseStudentSerializer(student)
        return Response(serializer.data, status=201)