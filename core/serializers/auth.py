from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

User = get_user_model()


def _normalize(email: str) -> str:
    return email.strip().lower()


def _password_field() -> serializers.CharField:
    # trim_whitespace=False because leading and trailing spaces are legitimate
    # password characters and DRF strips them by default.
    return serializers.CharField(
        write_only=True,
        trim_whitespace=False,
        style={"input_type": "password"},
    )


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = _password_field()

    def validate_email(self, value: str) -> str:
        email = _normalize(value)
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("An account with that email already exists.")
        return email

    def validate(self, attrs):
        # Runs the AUTH_PASSWORD_VALIDATORS from settings. The unsaved user is
        # passed so UserAttributeSimilarityValidator can reject a password that
        # is just the email address back again.
        try:
            validate_password(attrs["password"], User(email=attrs["email"]))
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": list(exc.messages)}) from exc
        return attrs


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = _password_field()

    def validate_email(self, value: str) -> str:
        return _normalize(value)

    def validate(self, attrs):
        # authenticate() runs the configured backends, checks the password hash,
        # rejects inactive accounts, and records which backend approved the
        # login so login() does not need to be told.
        user = authenticate(
            self.context.get("request"),
            username=attrs["email"],
            password=attrs["password"],
        )
        if user is None:
            # Deliberately does not say which half was wrong: separate messages
            # would let someone probe which addresses have accounts.
            raise serializers.ValidationError({"email": "Incorrect email address or password."})
        attrs["user"] = user
        return attrs
