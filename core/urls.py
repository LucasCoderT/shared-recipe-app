from django.urls import path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from core import views

app_name = "core"

urlpatterns = [
    path("health/", views.HealthView.as_view(), name="health"),
    path("whoami/", views.WhoAmIView.as_view(), name="whoami"),
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    path("docs/", SpectacularSwaggerView.as_view(url_name="core:schema"), name="docs"),
]
