from decimal import Decimal

from rest_framework import serializers


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
