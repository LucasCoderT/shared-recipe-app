from django.db import models

from core.models import base
from core.units import validate_unit


class ShoppingListItem(base.OrderableModelMixin, base.TimestampedModel):
    shopping_list = models.ForeignKey(
        "ShoppingList", on_delete=models.CASCADE, related_name="items"
    )
    ingredient = models.ForeignKey(
        "RecipeIngredient",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="shopping_list_items",
    )
    name = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    unit = models.CharField(max_length=50, validators=[validate_unit])
    purchased = models.BooleanField(default=False)

    class Meta:
        order_with_respect_to = "shopping_list"
        constraints = [
            models.UniqueConstraint(
                fields=["shopping_list", "_order"],
                name="uniq_order_per_shopping_list_item",
                deferrable=models.Deferrable.DEFERRED,
            ),
        ]

    def __str__(self):
        return f"{self.name} ({'Purchased' if self.purchased else 'Not Purchased'})"


class ShoppingList(base.TimestampedModel):
    name = models.CharField(max_length=255)
    user = models.ForeignKey("auth.User", on_delete=models.CASCADE, related_name="shopping_lists")

    class Meta:
        indexes = [
            models.Index(fields=["user", "-created_at"], name="slist_user_created_idx"),
        ]

    def __str__(self):
        return f"Shopping List: {self.name}"
