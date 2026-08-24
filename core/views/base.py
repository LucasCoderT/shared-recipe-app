from datetime import datetime

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_datetime
from django.utils.timezone import is_aware
from drf_spectacular.utils import extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from core.exceptions import StaleWrite
from core.models import Recipe, ShoppingList
from core.permissions import HasGroupPermissionAndOwnershipOrReadOnly, is_admin_user
from core.serializers import ReorderSerializer


def _parse_client_ts(value: object) -> datetime | None:
    """Parse the updated_at token from request data.

    Returns None only when the field is absent (None / not provided), which
    disables the stale-write check for that request.

    Raises ValidationError (400) for any provided-but-unusable value so a
    client that tried to send a token but got the format wrong gets an explicit
    error rather than silently losing optimistic-lock protection.
    """
    if value is None:
        return None
    if not isinstance(value, str):
        raise ValidationError({"updated_at": "A datetime string is required."})
    ts = parse_datetime(value)
    if ts is None:
        raise ValidationError({"updated_at": "Enter a valid ISO 8601 datetime."})
    if not is_aware(ts):
        raise ValidationError({"updated_at": "Datetime must include a timezone offset."})
    return ts


def _truncate_to_ms(ts: datetime) -> datetime:
    """Truncate microseconds to millisecond precision.

    JavaScript Date only carries milliseconds, so a timestamp echoed through a
    JS client loses the sub-millisecond digits. Truncating both sides to ms
    makes the comparison safe without requiring the frontend to treat the token
    as an opaque string.
    """
    return ts.replace(microsecond=(ts.microsecond // 1000) * 1000)


def ensure_recipe_owned(*, user, recipe: Recipe) -> None:
    if is_admin_user(user):
        return
    if recipe.author_id != user.id:
        raise PermissionDenied("You can only modify resources that belong to your own recipes.")


def ensure_shopping_list_owned(*, user, shopping_list: ShoppingList) -> None:
    if is_admin_user(user):
        return
    if shopping_list.user_id != user.id:
        raise PermissionDenied(
            "You can only modify resources that belong to your own shopping lists."
        )


class OwnedResourceViewSet(viewsets.ModelViewSet):
    permission_classes = [HasGroupPermissionAndOwnershipOrReadOnly]

    def _check_stale_write(self, instance):
        """Validate the updated_at token and return a row-locked instance.

        - Token absent → returns the original instance (check skipped).
        - Token present and matches → returns the select_for_update locked instance.
        - Token present but mismatches → raises StaleWrite (409).
        - Token present but malformed/naive → raises ValidationError (400).

        of=("self",) locks only the primary table row; without it, PostgreSQL
        rejects the lock because select_related adds nullable outer joins.
        """
        client_ts = _parse_client_ts(self.request.data.get("updated_at"))
        if client_ts is None:
            return instance
        locked = self.get_queryset().select_for_update(of=("self",)).get(pk=instance.pk)
        if _truncate_to_ms(locked.updated_at) != _truncate_to_ms(client_ts):
            raise StaleWrite()
        return locked

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self._check_stale_write(self.get_object())

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(instance, "_prefetched_objects_cache", None):
            instance._prefetched_objects_cache = {}

        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self._check_stale_write(self.get_object())
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


class OrderableNestedMixin:
    """Adds a reorder action to a nested collection using order_with_respect_to.

    Django generates set_<model>_order() on the parent for every child declaring
    order_with_respect_to, so the reordering itself is a one-liner. What this
    adds is the endpoint, the ownership check, and validation that the submitted
    list is a complete permutation of the children that exist.

    The DEFERRED unique constraint on (recipe, _order) is what lets this work:
    the bulk update passes through states where two rows briefly share a
    position, which an immediately-checked constraint would reject.
    """

    order_setter_name: str = ""

    @extend_schema(request=ReorderSerializer, responses={200: None})
    @action(detail=False, methods=["post"], url_path="reorder")
    def reorder(self, request, **kwargs):
        recipe = self.get_parent_recipe()
        ensure_recipe_owned(user=request.user, recipe=recipe)

        serializer = ReorderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        submitted = serializer.validated_data["order"]

        existing = set(self.get_queryset().values_list("id", flat=True))
        if set(submitted) != existing or len(submitted) != len(existing):
            raise ValidationError({"order": "Send every id for this recipe exactly once."})

        with transaction.atomic():
            getattr(recipe, self.order_setter_name)(submitted)

        page = self.get_serializer(self.get_queryset(), many=True)
        return Response(page.data)


class RecipeNestedViewSet(OwnedResourceViewSet):
    recipe_queryset = Recipe.objects.select_related("author").all()

    def get_parent_recipe(self) -> Recipe:
        return get_object_or_404(self.recipe_queryset, pk=self.kwargs.get("recipe_pk"))

    def get_queryset(self):
        return super().get_queryset().filter(recipe_id=self.kwargs.get("recipe_pk"))

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["recipe"] = self.get_parent_recipe()
        return context


class ShoppingListNestedViewSet(OwnedResourceViewSet):
    shopping_list_queryset = ShoppingList.objects.select_related("user").all()

    def get_parent_shopping_list(self) -> ShoppingList:
        return get_object_or_404(
            self.shopping_list_queryset,
            pk=self.kwargs.get("shopping_list_pk"),
        )

    def get_queryset(self):
        """Items are only visible to the owner of the list holding them.

        Filtering by shopping_list_id alone would let anyone read another
        user's items by guessing a list id, because safe methods bypass the
        ownership check in the permission class.
        """
        queryset = (
            super().get_queryset().filter(shopping_list_id=self.kwargs.get("shopping_list_pk"))
        )
        if is_admin_user(self.request.user):
            return queryset
        if not self.request.user.is_authenticated:
            return queryset.none()
        return queryset.filter(shopping_list__user=self.request.user)
