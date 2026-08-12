from django.shortcuts import render, get_object_or_404

from rest_framework.response import Response
from rest_framework.decorators import api_view

from .models import Teacher
from .serializers import TeacherSerializer


def teacher_list(request):

    teachers = Teacher.objects.filter(is_active=True)

    context = {
        "teachers": teachers,
    }

    return render(
        request,
        "teachers/teacher_list.html",
        context
    )


def teacher_detail(request, pk):

    teacher = get_object_or_404(
        Teacher,
        pk=pk,
        is_active=True
    )

    context = {
        "teacher": teacher,
    }

    return render(
        request,
        "teachers/teacher_detail.html",
        context
    )


@api_view(["GET", "POST"])
def teacher_api_list(request):

    if request.method == "GET":
        teachers = Teacher.objects.filter(is_active=True)

        serializer = TeacherSerializer(teachers, many=True)

        return Response(serializer.data)

    if request.method == "POST":
        serializer = TeacherSerializer(data=request.data)

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
def teacher_api_detail(request, pk):

    teacher = get_object_or_404(
        Teacher,
        pk=pk,
        is_active=True
    )

    if request.method == "GET":
        serializer = TeacherSerializer(teacher)
        return Response(serializer.data)

    if request.method == "PATCH":
        serializer = TeacherSerializer(
            teacher,
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
        teacher.delete()
        return Response(status=204)