from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, re_path

from core.views import spa_index

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("core.urls")),
]

if settings.DEBUG:
    # Dev-only media serving.
    # This has to live in the project URLconf: mounted at /media/ and served from MEDIA_ROOT.
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Catch-all LAST: any non-API path is handed to the React router.
urlpatterns += [
    re_path(r"^(?!api/|admin/|static/|media/).*$", spa_index, name="spa"),
]
