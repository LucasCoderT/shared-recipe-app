from collections.abc import Iterable
from typing import TYPE_CHECKING

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.db.models import Model

if TYPE_CHECKING:
    from core.models import User

from core.models import (
    Recipe,
    RecipeComment,
    RecipeIngredient,
    RecipePhoto,
    RecipeReview,
    RecipeStep,
    RecipeStepIngredient,
    RecipeTag,
    ShoppingList,
    ShoppingListItem,
)

ADMIN_GROUP = "Admin"
RECIPE_EDITORS_GROUP = "Recipe Editors"
RECIPE_INTERACTORS_GROUP = "Recipe Interactors"
SHOPPING_LIST_EDITORS_GROUP = "Shopping List Editors"

DEFAULT_GROUP_MODELS = {
    RECIPE_EDITORS_GROUP: (
        Recipe,
        RecipeIngredient,
        RecipePhoto,
        RecipeStep,
        RecipeStepIngredient,
        RecipeTag,
    ),
    RECIPE_INTERACTORS_GROUP: (
        RecipeComment,
        RecipeReview,
    ),
    SHOPPING_LIST_EDITORS_GROUP: (
        ShoppingList,
        ShoppingListItem,
    ),
}

DEFAULT_PERMISSION_ACTIONS = ("view", "add", "change", "delete")
DEFAULT_USER_GROUPS = (
    RECIPE_EDITORS_GROUP,
    RECIPE_INTERACTORS_GROUP,
    SHOPPING_LIST_EDITORS_GROUP,
)


def build_model_permission_codenames(model: type[Model]) -> list[str]:
    return [f"{action}_{model._meta.model_name}" for action in DEFAULT_PERMISSION_ACTIONS]


def permissions_for_models(models: Iterable[type[Model]]) -> list[Permission]:
    permissions: list[Permission] = []
    for model in models:
        permissions.extend(
            Permission.objects.filter(
                content_type__app_label=model._meta.app_label,
                content_type__model=model._meta.model_name,
                codename__in=build_model_permission_codenames(model),
            )
        )
    return permissions


def ensure_default_groups() -> None:
    all_models = [m for models in DEFAULT_GROUP_MODELS.values() for m in models]
    admin_group, _ = Group.objects.get_or_create(name=ADMIN_GROUP)
    admin_group.permissions.set(permissions_for_models(all_models))

    for group_name, models in DEFAULT_GROUP_MODELS.items():
        group, _ = Group.objects.get_or_create(name=group_name)
        group.permissions.set(permissions_for_models(models))


def assign_default_groups_to_users(users: Iterable["User"]) -> None:
    users = [
        user
        for user in users
        if user.pk is not None and not user.is_superuser and not user.is_staff
    ]
    if not users:
        return

    ensure_default_groups()
    groups = list(Group.objects.filter(name__in=DEFAULT_USER_GROUPS))
    membership_model = get_user_model().groups.through
    membership_model.objects.bulk_create(
        [
            membership_model(user_id=user.pk, group_id=group.pk)
            for user in users
            for group in groups
        ],
        ignore_conflicts=True,
    )
