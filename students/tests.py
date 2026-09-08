from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Student


class StudentAdminAPITests(APITestCase):
    def setUp(self):
        user_model = get_user_model()

        self.regular_user = user_model.objects.create_user(
            username="regular-user",
            password="test-password-123",
        )

        self.admin_user = user_model.objects.create_superuser(
            username="admin-user",
            password="test-password-123",
            email="admin@example.com",
        )

        self.student = Student.objects.create(
            full_name="Test Student",
            phone="09123456789",
            age=20,
            level=Student.Level.BEGINNER,
            notes="Test notes",
        )

        self.list_url = reverse(
            "student_admin:list-create"
        )

        self.detail_url = reverse(
            "student_admin:detail",
            kwargs={"pk": self.student.pk},
        )

    def test_anonymous_user_cannot_access_students(self):
        response = self.client.get(self.list_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_regular_user_cannot_access_students(self):
        self.client.force_authenticate(
            user=self.regular_user
        )

        response = self.client.get(self.list_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_admin_can_create_student(self):
        self.client.force_authenticate(
            user=self.admin_user
        )

        payload = {
            "name": "New Student",
            "phone": "09121112233",
            "age": 18,
            "level": "intermediate",
            "notes": "New student notes",
        }

        response = self.client.post(
            self.list_url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )
        self.assertEqual(Student.objects.count(), 2)

    def test_admin_receives_paginated_student_list(self):
        self.client.force_authenticate(
            user=self.admin_user
        )

        response = self.client.get(self.list_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(
            len(response.data["results"]),
            1,
        )

    def test_admin_can_update_student(self):
        self.client.force_authenticate(
            user=self.admin_user
        )

        response = self.client.patch(
            self.detail_url,
            {
                "name": "Updated Student",
                "level": "advanced",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.student.refresh_from_db()

        self.assertEqual(
            self.student.full_name,
            "Updated Student",
        )
        self.assertEqual(
            self.student.level,
            Student.Level.ADVANCED,
        )

    def test_delete_soft_deactivates_student(self):
        self.client.force_authenticate(
            user=self.admin_user
        )

        response = self.client.delete(self.detail_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT,
        )

        self.student.refresh_from_db()

        self.assertFalse(self.student.is_active)
        self.assertEqual(Student.objects.count(), 1)

    def test_admin_cannot_create_student_with_invalid_phone(self):
        self.client.force_authenticate(
            user=self.admin_user
        )

        payload = {
            "name": "Invalid Phone Student",
            "phone": "123",
            "age": 18,
            "level": "beginner",
        }

        response = self.client.post(
            self.list_url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertEqual(Student.objects.count(), 1)