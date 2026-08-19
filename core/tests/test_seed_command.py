import pytest
from django.contrib.auth.models import User

from core.models import Recipe, ShoppingList, ShoppingListItem

pytestmark = pytest.mark.django_db


def _assert_contiguous_order(values: list[int]) -> None:
    assert values == list(range(len(values)))


def test__given_seed_command__then_creates_expected_dataset(seed_data_factory) -> None:
    seed_data_factory(recipes=0, authors=5)

    seeded_users = User.objects.filter(
        username__in=["ava_cooks", "marco_kitchen", "nina_bakes"]
    )
    assert seeded_users.count() == 3
    assert Recipe.objects.count() == 5
    assert ShoppingList.objects.count() == 6
    assert User.objects.filter(username__startswith="cook_").count() == 5

    assert all(user.check_password("TestPassword@1") for user in seeded_users)


def test__given_seed_command_runs_twice__then_seeded_records_are_replaced_without_duplicates(
    seed_data_factory,
) -> None:
    seed_data_factory(recipes=0, authors=5)
    seed_data_factory(recipes=0, authors=5)

    assert (
        User.objects.filter(username__in=["ava_cooks", "marco_kitchen", "nina_bakes"]).count() == 3
    )
    assert Recipe.objects.count() == 5
    assert ShoppingList.objects.count() == 6
    assert User.objects.filter(username__startswith="cook_").count() == 5


def test__given_seed_command__then_all_orderable_models_have_valid_order_positions(
    seed_data_factory,
) -> None:
    seed_data_factory(recipes=50, authors=20, random_seed=20260819)

    synthetic_recipe_names = list(
        Recipe.objects.filter(name__contains="#").values_list("name", flat=True)
    )
    assert len(synthetic_recipe_names) == 50
    assert len(set(synthetic_recipe_names)) == 50

    for recipe in Recipe.objects.all():
        ingredient_orders = list(
            recipe.recipe_ingredients.order_by("_order").values_list("_order", flat=True)
        )
        step_orders = list(recipe.recipe_steps.order_by("_order").values_list("_order", flat=True))
        tag_orders = list(recipe.recipe_tags.order_by("_order").values_list("_order", flat=True))
        photo_orders = list(
            recipe.recipe_photos.order_by("_order").values_list("_order", flat=True)
        )

        _assert_contiguous_order(ingredient_orders)
        _assert_contiguous_order(step_orders)
        _assert_contiguous_order(tag_orders)
        _assert_contiguous_order(photo_orders)

    for shopping_list in ShoppingList.objects.all():
        item_orders = list(shopping_list.items.order_by("_order").values_list("_order", flat=True))
        _assert_contiguous_order(item_orders)
        assert shopping_list.items.count() <= 20


def test__given_shopping_list_flag__then_creates_requested_number_of_synthetic_lists(
    seed_data_factory,
) -> None:
    seed_data_factory(recipes=20, authors=5, shopping_lists=7)

    assert Recipe.objects.count() == 25
    assert ShoppingList.objects.count() == 6 + 7
    assert ShoppingListItem.objects.count() > 0
