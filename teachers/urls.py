from django.urls import path
from . import views


urlpatterns = [
    path("", views.teacher_list, name="teacher-list"),
    path("<int:pk>/", views.teacher_detail, name="teacher-detail"),
    
    path("api/", views.teacher_api_list, name="teacher-api-list"),
    path(
    "api/<int:pk>/",
    views.teacher_api_detail,
    name="teacher-api-detail"),
]