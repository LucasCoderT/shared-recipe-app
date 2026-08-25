from datetime import datetime

from django.db import IntegrityError, transaction
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_datetime
from django.utils.timezone import is_aware
from drf_spectacular.utils import extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from core.exceptions import AlreadyExists, StaleWrite
from core.models import Recipe, ShoppingList
from core.permissions import HasGroupPermissionAndOwnershipOrReadOnly, is_admin_user
from core.serializers import ReorderSerializer


def _parse_client_ts(value: object) -> datetime | None:
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
    """
    Truncates a datetime object to millisecond precision.
    This is needed because JavaScript's Date object only supports milliseconds,
    while Python's datetime supports microseconds.
    This function ensures that when comparing timestamps between the client and server,
    we are only considering milliseconds.
    Args:
        ts: The datetime object to be truncated.

    Returns:
        A new datetime object truncated to millisecond precision.

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

    def perform_create(self, serializer) -> None:
        self._save_or_conflict(serializer)

    def perform_update(self, serializer) -> None:
        self._save_or_conflict(serializer)

    @staticmethod
    def _save_or_conflict(serializer, **kwargs) -> None:
        """
        Saves the serializer, turning a unique-constraint violation into a 409.

        The serializers catch the obvious duplicates up front with a field error,
        but two requests can still race past that check. The savepoint keeps the
        request transaction usable after the failed INSERT so the error response
        can be written.
        """
        try:
            with transaction.atomic():
                serializer.save(**kwargs)
        except IntegrityError as exc:
            if "unique" not in str(exc).lower():
                raise
            raise AlreadyExists() from exc

    def _check_stale_write(self, instance):
        """
        Validates that the resource has not been modified since it was loaded by the client.
        Scenarios:
            - Token absent → returns the original instance (check skipped).
            - Token present and matches → returns the select_for_update locked instance.
            - Token present but mismatches → raises StaleWrite (409).
            - Token present but malformed/naive → raises ValidationError (400).
        Args:
            instance: The object being modified.
            This is the object that was retrieved from the database and is being updated or deleted.

        Returns:
            The locked instance if the timestamps match, otherwise raises an exception.
        """
        client_ts = _parse_client_ts(self.request.data.get("updated_at"))
        if client_ts is None:
            return instance
        # Locks the specific row in the database for update.
        # of=("self",) restricts the lock to this table's own row, which postgres
        # requires here: select_related adds nullable outer joins, and postgres
        # refuses FOR UPDATE on the nullable side of an outer join.
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
    """
    Mixin for nested viewsets that support reordering of items within a parent resource.
    Requires the viewset to define an `order_setter_name` attribute, which should be
    the name of a method on the parent resource that accepts a
    list of item IDs in the desired order.
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
        queryset = (
            super().get_queryset().filter(shopping_list_id=self.kwargs.get("shopping_list_pk"))
        )
        if is_admin_user(self.request.user):
            return queryset
        if not self.request.user.is_authenticated:
            return queryset.none()
        return queryset.filter(shopping_list__user=self.request.user)
