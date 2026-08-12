from rest_framework.response import Response
from rest_framework.decorators import api_view

from django.shortcuts import render, get_object_or_404

from .models import Course
from .serializers import CourseSerializer
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