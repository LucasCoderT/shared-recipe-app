from decimal import Decimal

from rest_framework import serializers


class RelativeImageField(serializers.ImageField):
    """Serialise an image as a root-relative URL.

    DRF's ImageField builds an absolute URL from the Host header. The dev
    server proxies with changeOrigin, so under Docker that yields
    http://backend:8000/media/... -- a hostname that only resolves inside the
    compose network, which the browser renders as a broken image.

    The SPA is served from the same origin as the API, so a relative path is
    correct and immune to whatever Host the request arrived with. Uploads are
    unaffected: only the output representation changes.
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
