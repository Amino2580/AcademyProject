from rest_framework import serializers
from .models import Course, CourseStudent


class CourseSerializer(serializers.ModelSerializer):

    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError(
                "عنوان کلاس نمی‌تواند خالی باشد."
            )

        return value.strip()

    def validate(self, data):
        day = data.get("day")
        start_time = data.get("start_time")
        end_time = data.get("end_time")
        teacher = data.get("teacher")
        room = data.get("room")

        # بررسی کامل بودن اطلاعات زمان‌بندی
        if not day or not start_time or not end_time or not room:
            raise serializers.ValidationError(
                "روز، ساعت شروع، ساعت پایان و اتاق کلاس الزامی هستند."
            )

        # ساعت شروع باید قبل از پایان باشد
        if start_time >= end_time:
            raise serializers.ValidationError(
                "ساعت شروع باید قبل از ساعت پایان باشد."
            )

        # کلاس‌های موجود در همان روز
        existing_courses = Course.objects.filter(
            day=day,
            is_active=True
        )

        # در PATCH خود کلاس را از بررسی خارج می‌کنیم
        if self.instance:
            existing_courses = existing_courses.exclude(
                pk=self.instance.pk
            )

        # بررسی تداخل زمانی
        overlapping_courses = existing_courses.filter(
            start_time__lt=end_time,
            end_time__gt=start_time
        )

        # تداخل استاد
        if overlapping_courses.filter(
            teacher=teacher
        ).exists():
            raise serializers.ValidationError(
                "این استاد در این ساعت کلاس دیگری دارد."
            )

        # تداخل اتاق
        if overlapping_courses.filter(
            room=room
        ).exists():
            raise serializers.ValidationError(
                "این اتاق در این ساعت اشغال است."
            )

        return data

    class Meta:
        model = Course
        fields = [
            "id",
            "title",
            "teacher",
            "description",
            "price",
            "is_active",
            "day",
            "start_time",
            "end_time",
            "room",
        ]


class CourseStudentSerializer(serializers.ModelSerializer):

    class Meta:
        model = CourseStudent
        fields = [
            "id",
            "course",
            "national_id",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
        ]