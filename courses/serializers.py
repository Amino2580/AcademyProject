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

        required_fields = {
            "day": day,
            "start_time": start_time,
            "end_time": end_time,
            "room": room
        }
        
        for field_name, field_value in required_fields.items():
            if field_value is None or field_value == "":
                raise serializers.ValidationError(
                    {field_name: f"فیلد {field_name} الزامی است."}
                )

        if start_time >= end_time:
            raise serializers.ValidationError(
                "ساعت شروع باید قبل از ساعت پایان باشد."
            )

        existing_courses = Course.objects.filter(
            day=day,
            is_active=True
        )

        if self.instance:
            existing_courses = existing_courses.exclude(
                pk=self.instance.pk
            )

        overlapping_courses = existing_courses.filter(
            start_time__lt=end_time,
            end_time__gt=start_time
        )

        if teacher is not None and overlapping_courses.filter(teacher=teacher).exists():
            raise serializers.ValidationError(
                "این استاد در این ساعت کلاس دیگری دارد."
            )

        if room is not None and overlapping_courses.filter(room=room).exists():
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