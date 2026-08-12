from django.urls import path
from . import views


urlpatterns = [
    path("", views.course_list, name="course-list"),
    path("<int:pk>/", views.course_detail, name="course-detail"),
    path(
    "api/",
    views.course_api_list,
    name="course-api-list"
),
    path(
    "api/<int:pk>/",
    views.course_api_detail,
    name="course-api-detail"
),
    path(
    "test-user/",
    views.test_user_service,
    name="test-user-service"
),
]