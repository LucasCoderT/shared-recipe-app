import pytest
from django.contrib.auth.models import User

from core.models import Recipe, RecipeIngredient, RecipePhoto, RecipeStep, RecipeTag

pytestmark = pytest.mark.django_db


def build_recipe() -> Recipe:
    author = User.objects.create_user(username="ordering-test-author")
    return Recipe.objects.create(
        name="Ordering Test Recipe", author=author, description="Testing order"
    )


def test__given_recipe_tag_ordering__then_position_reflects_parent_order() -> None:
    recipe = build_recipe()
    first = RecipeTag.objects.create(recipe=recipe, name="First")
    second = RecipeTag.objects.create(recipe=recipe, name="Second")

    recipe.set_recipetag_order([second.pk, first.pk])
    first.refresh_from_db()
    second.refresh_from_db()

    assert first.position == 2
    assert second.position == 1


def test__given_recipe_step_ordering__then_position_reflects_parent_order() -> None:
    recipe = build_recipe()
    first = RecipeStep.objects.create(recipe=recipe, description="First")
    second = RecipeStep.objects.create(recipe=recipe, description="Second")

    recipe.set_recipestep_order([second.pk, first.pk])
    first.refresh_from_db()
    second.refresh_from_db()

    assert first.position == 2
    assert second.position == 1


def test__given_recipe_item_ordering__then_positions_reflect_parent_order() -> None:
    recipe = build_recipe()
    first_ingredient = RecipeIngredient.objects.create(
        recipe=recipe,
        name="Flour",
        quantity="250",
        unit="gram",
    )
    second_ingredient = RecipeIngredient.objects.create(
        recipe=recipe,
        name="Water",
        quantity="125",
        unit="gram",
    )
    first_photo = RecipePhoto.objects.create(recipe=recipe, image="photo-1.jpg")
    second_photo = RecipePhoto.objects.create(recipe=recipe, image="photo-2.jpg")

    recipe.set_recipeingredient_order([second_ingredient.pk, first_ingredient.pk])
    recipe.set_recipephoto_order([second_photo.pk, first_photo.pk])
    first_ingredient.refresh_from_db()
    second_ingredient.refresh_from_db()
    first_photo.refresh_from_db()
    second_photo.refresh_from_db()

    assert first_ingredient.position == 2
    assert second_ingredient.position == 1
    assert first_photo.position == 2
    assert second_photo.position == 1
