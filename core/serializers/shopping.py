from decimal import Decimal

from rest_framework import serializers
from rest_framework.relations import PrimaryKeyRelatedField

from core.models import Recipe, ShoppingList, ShoppingListItem

from .base import TimestampedModelSerializer, validate_nonblank_text, validate_positive_decimal


class ShoppingListSerializer(TimestampedModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = ShoppingList
        fields = ("id", "created_at", "updated_at", "name", "user")
        read_only_fields = ("id", "created_at", "updated_at", "user")

    def validate_name(self, value: str) -> str:
        return validate_nonblank_text(value=value, field_name="Name")


class ShoppingListItemSerializer(TimestampedModelSerializer):
    position = serializers.IntegerField(read_only=True)
    quantity = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,
        allow_null=True,
        min_value=Decimal("0.01"),
    )

    class Meta:
        model = ShoppingListItem
        fields = (
            "id",
            "created_at",
            "updated_at",
            "shopping_list",
            "ingredient",
            "name",
            "quantity",
            "unit",
            "purchased",
            "position",
        )
        read_only_fields = ("id", "created_at", "updated_at", "shopping_list", "position")

    def validate_name(self, value: str) -> str:
        return validate_nonblank_text(value=value, field_name="Item name")

    def validate_quantity(self, value: Decimal | None) -> Decimal | None:
        return validate_positive_decimal(value=value, field_name="Quantity")


class ShoppingListItemFromRecipeSerializer(serializers.Serializer):
    recipe = PrimaryKeyRelatedField(queryset=Recipe.objects.all())
