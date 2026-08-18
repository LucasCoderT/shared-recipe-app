from django.contrib import admin
from django.urls import include, path, re_path

from core.views import spa_index

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("core.urls")),
    # Catch-all LAST: any non-API path is handed to the React router.
    re_path(r"^(?!api/|admin/|static/|media/).*$", spa_index, name="spa"),
]
