from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from drf_spectacular.utils import extend_schema
from rest_framework import views
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from core.serializers import HealthSerializer, WhoAmISerializer


class HealthView(views.APIView):

    permission_classes = [AllowAny]
    serializer_class = HealthSerializer

    @extend_schema(operation_id="health")
    def get(self, request: Request) -> Response:
        return Response({"status": "ok"})


@method_decorator(ensure_csrf_cookie, name="dispatch")
class WhoAmIView(views.APIView):

    serializer_class = WhoAmISerializer

    @extend_schema(operation_id="whoami")
    def get(self, request: Request) -> Response:
        if request.user.is_authenticated:
            serializer = self.serializer_class.from_user(request.user)
            return Response(serializer.data)
        return Response({"authenticated": False})
