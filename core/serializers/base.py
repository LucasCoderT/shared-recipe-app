from decimal import Decimal

from rest_framework import serializers


class RelativeImageField(serializers.ImageField):
    """Serializes the image as a root-relative URL.

    DRF's ImageField creates an absolute URL based on the Host header. But the
    development server proxies with changeOrigin; hence, in Docker, it gives
    us http://backend:8000/media/..., which only resolves within the compose
    network and appears as a broken image in the browser.

    Since the SPA is served from the same origin as the API, using a relative
    URL makes sense and won't be affected by the Host used in the request.
    """

    def to_representation(self, value):
        if not value:
            return None
        return value.url


class TimestampedModelSerializer(serializers.ModelSerializer):
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)


def validate_nonblank_text(*, value: str, field_name: str) -> str:
    normalized = value.strip()
    if not normalized:
        raise serializers.ValidationError(f"{field_name} must not be blank.")
    return normalized


def validate_optional_text(value: str) -> str:
    return value.strip()


def validate_positive_decimal(*, value: Decimal | None, field_name: str) -> Decimal | None:
    if value is None:
        return None
    if value <= 0:
        raise serializers.ValidationError(f"{field_name} must be greater than 0.")
    return value
