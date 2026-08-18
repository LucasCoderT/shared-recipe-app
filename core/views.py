from django.http import HttpRequest, HttpResponse, JsonResponse
from django.template import TemplateDoesNotExist
from django.template.response import TemplateResponse
from drf_spectacular.utils import extend_schema
from rest_framework import views
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from core.serializers import HealthSerializer, WhoAmISerializer


class HealthView(views.APIView):
    """General health check endpoint."""

    permission_classes = [AllowAny]
    serializer_class = HealthSerializer

    @extend_schema(operation_id="health")
    def get(self, request: Request) -> Response:
        """Return the simplest possible ok response."""
        return Response({"status": "ok"})


class WhoAmIView(views.APIView):
    """Returns the current user, or an anonymous marker when logged out."""

    serializer_class = WhoAmISerializer

    @extend_schema(operation_id="whoami")
    def get(self, request: Request) -> Response:
        """Return the current user, or an anonymous marker when logged out."""
        if request.user.is_authenticated:
            serializer = self.serializer_class.from_user(request.user)
            return Response(serializer.data)
        else:
            return Response({"authenticated": False})


def spa_index(request: HttpRequest) -> HttpResponse:
    """Serves the React app shell, or a clear hint if the bundle is missing."""
    try:
        return TemplateResponse(request, "index.html")
    except TemplateDoesNotExist:
        return JsonResponse(
            {
                "detail": "Frontend bundle not built.",
                "fix": "Run npm run build in frontend/, or use the Vite dev server on :5173.",
            },
            status=501,
        )
