from core.models import ShoppingList, ShoppingListItem
from core.serializers import ShoppingListItemSerializer, ShoppingListSerializer

from .base import OwnedResourceViewSet, ShoppingListNestedViewSet, ensure_shopping_list_owned


class ShoppingListViewSet(OwnedResourceViewSet):
    queryset = ShoppingList.objects.select_related("user").order_by("name", "-created_at")
    serializer_class = ShoppingListSerializer

    def perform_create(self, serializer) -> None:
        serializer.save(user=self.request.user)


class ShoppingListItemViewSet(ShoppingListNestedViewSet):
    queryset = ShoppingListItem.objects.select_related(
        "shopping_list",
        "shopping_list__user",
        "ingredient",
    ).all()
    serializer_class = ShoppingListItemSerializer

    def perform_create(self, serializer) -> None:
        shopping_list = self.get_parent_shopping_list()
        ensure_shopping_list_owned(user=self.request.user, shopping_list=shopping_list)
        serializer.save(shopping_list=shopping_list)
