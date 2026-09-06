from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
)


urlpatterns = [
    path("admin/", admin.site.urls),

    # Legacy APIs - temporarily disabled
    # path("teachers/", include("teachers.urls")),
    # path("courses/", include("courses.urls")),

    # Public APIs
    path(
        "api/registrations/",
        include("registrations.urls"),
    ),

    # Admin APIs
    path(
        "api/admin/registrations/",
        include("registrations.admin_urls"),
    ),

    # API documentation
    path(
        "api/schema/",
        SpectacularAPIView.as_view(),
        name="schema",
    ),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(
            url_name="schema"
        ),
        name="swagger-ui",
    ),
    path(
    "api/admin/students/",
    include("students.urls"),
    ),
]


urlpatterns += static(
    settings.MEDIA_URL,
    document_root=settings.MEDIA_ROOT,
)