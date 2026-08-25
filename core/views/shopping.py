from django.db import transaction
from django.db.models import QuerySet
from drf_spectacular.utils import extend_schema
from rest_framework.decorators import action
from rest_framework.response import Response

from core.models import Recipe, ShoppingList, ShoppingListItem
from core.permissions import is_admin_user
from core.serializers import (
    ShoppingListItemFromRecipeSerializer,
    ShoppingListItemSerializer,
    ShoppingListSerializer,
)

from .base import OwnedResourceViewSet, ShoppingListNestedViewSet, ensure_shopping_list_owned


class ShoppingListViewSet(OwnedResourceViewSet):
    queryset = ShoppingList.objects.select_related("user").order_by("name", "-created_at")
    serializer_class = ShoppingListSerializer
    # A user's lists are a small owned collection the UI renders in full.
    pagination_class = None

    def get_queryset(self) -> "QuerySet[ShoppingList]":
        """
        Builds a queryset of shopping lists that the current user is allowed to see.
        If the user is an admin, they can see all shopping lists.
        If the user is not authenticated, they cannot see any shopping lists.
        Otherwise, they can only see their own shopping lists.
        Returns:
            QuerySet[ShoppingList]: The queryset of shopping lists the user is allowed to see.
        """
        queryset = super().get_queryset()
        if is_admin_user(self.request.user):
            return queryset
        if not self.request.user.is_authenticated:
            return queryset.none()
        return queryset.filter(user=self.request.user)

    def perform_create(self, serializer) -> None:
        self._save_or_conflict(serializer, user=self.request.user)

    @extend_schema(
        request=ShoppingListItemFromRecipeSerializer,
        responses={200: ShoppingListItemSerializer(many=True)},
        description="Copy ingredients from a recipe into the shopping list.",
    )
    @action(
        detail=True,
        methods=["post"],
        url_path="copy_from_recipe",
        pagination_class=None,
    )
    def copy_ingredients_from_recipe(self, request, pk) -> Response:
        shopping_list = self.get_object()
        ensure_shopping_list_owned(user=self.request.user, shopping_list=shopping_list)
        recipe_data = ShoppingListItemFromRecipeSerializer(data=request.data)
        recipe_data.is_valid(raise_exception=True)
        recipe: Recipe = recipe_data.validated_data["recipe"]
        with transaction.atomic():
            ingredients = []
            for ingredient in recipe.ingredients.all():
                item = ShoppingListItem.objects.create(
                    shopping_list=shopping_list,
                    ingredient=ingredient,
                    name=ingredient.name,
                    quantity=ingredient.quantity,
                    unit=ingredient.unit,
                )
                ingredients.append(item)
        return Response(
            ShoppingListItemSerializer(
                ingredients, many=True, context=self.get_serializer_context()
            ).data
        )


class ShoppingListItemViewSet(ShoppingListNestedViewSet):
    queryset = ShoppingListItem.objects.select_related(
        "shopping_list",
        "shopping_list__user",
        "ingredient",
    ).all()
    serializer_class = ShoppingListItemSerializer
    # Items are shown as one list with a running "still to buy" count, so the
    # client needs all of them; paging at 24 hid everything past the first page.
    pagination_class = None

    def perform_create(self, serializer) -> None:
        shopping_list = self.get_parent_shopping_list()
        ensure_shopping_list_owned(user=self.request.user, shopping_list=shopping_list)
        self._save_or_conflict(serializer, shopping_list=shopping_list)
