from django.contrib.auth import get_user_model, login, logout
from drf_spectacular.utils import extend_schema
from rest_framework import status, views
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from core.serializers import LoginSerializer, RegisterSerializer, WhoAmISerializer

User = get_user_model()


class RegisterView(views.APIView):
    """Create an account from an email address and start a session."""

    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    @extend_schema(
        operation_id="register",
        request=RegisterSerializer,
        responses={201: WhoAmISerializer},
    )
    def post(self, request: Request) -> Response:
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = User.objects.create_user(
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )

        # login() resolves the backend itself: authenticate() annotates the user
        # for the login view, and for a newly created user Django falls back to
        # the single configured AUTHENTICATION_BACKENDS entry.
        login(request, user)
        return Response(
            WhoAmISerializer.from_user(user).data,
            status=status.HTTP_201_CREATED,
        )


class LoginView(views.APIView):
    """Start a session for an existing account."""

    permission_classes = [AllowAny]
    serializer_class = LoginSerializer

    @extend_schema(
        operation_id="login",
        request=LoginSerializer,
        responses={200: WhoAmISerializer},
    )
    def post(self, request: Request) -> Response:
        serializer = self.serializer_class(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        login(request, user)
        return Response(WhoAmISerializer.from_user(user).data)


class LogoutView(views.APIView):
    """End the current session."""

    permission_classes = [IsAuthenticated]

    @extend_schema(operation_id="logout", request=None, responses={204: None})
    def post(self, request: Request) -> Response:
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)
