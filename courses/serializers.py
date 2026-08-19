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
        instance = self.instance

        day = data.get("day") if "day" in data else (instance.day if instance else None)
        start_time = data.get("start_time") if "start_time" in data else (instance.start_time if instance else None)
        end_time = data.get("end_time") if "end_time" in data else (instance.end_time if instance else None)
        room = data.get("room") if "room" in data else (instance.room if instance else None)
        teacher = data.get("teacher") if "teacher" in data else (instance.teacher_id if instance else None)

        if not instance:
            if not day or not start_time or not end_time or not room:
                raise serializers.ValidationError(
                    "روز، ساعت شروع، ساعت پایان و اتاق کلاس الزامی هستند."
                )


        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError(
                "ساعت شروع باید قبل از ساعت پایان باشد."
            )

        if day and start_time and end_time and room:
            existing_courses = Course.objects.filter(
                day=day,
                is_active=True
            )

            if instance:
                existing_courses = existing_courses.exclude(pk=instance.pk)

            overlapping_courses = existing_courses.filter(
                start_time__lt=end_time,
                end_time__gt=start_time
            )

            # تداخل استاد
            if teacher and overlapping_courses.filter(teacher=teacher).exists():
                raise serializers.ValidationError(
                    "این استاد در این ساعت کلاس دیگری دارد."
                )

            # تداخل اتاق
            if room and overlapping_courses.filter(room=room).exists():
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