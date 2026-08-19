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
        return Response({"authenticated": False})
