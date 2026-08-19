import pytest
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError

from core.models import Recipe, RecipeIngredient

pytestmark = pytest.mark.django_db


def build_recipe() -> Recipe:
    author = User.objects.create_user(username="unit-test-author")
    return Recipe.objects.create(
        name="Unit Test Recipe", author=author, description="Testing units"
    )


def test__given_valid_pint_unit__then_save_normalizes_unit() -> None:
    recipe = build_recipe()
    ingredient = RecipeIngredient.objects.create(
        recipe=recipe,
        name="Flour",
        quantity="250",
        unit="gram",
    )

    assert ingredient.unit == "gram"


def test__given_invalid_pint_unit__then_save_raises_validation_error() -> None:
    recipe = build_recipe()
    with pytest.raises(ValidationError):
        RecipeIngredient.objects.create(
            recipe=recipe,
            name="Mystery Ingredient",
            quantity="1",
            unit="not-a-real-unit",
        )
