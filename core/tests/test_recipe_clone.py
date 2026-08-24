import pytest

from core.models import Recipe, RecipeStepIngredient, User

pytestmark = pytest.mark.django_db


def test_when_recipe_cloned_expect_children_cloned(seed_data_factory):
    seed_data_factory()
    cloner = User.objects.get(email="marco@example.com")
    original = Recipe.objects.get(name="Classic Spaghetti Bolognese")

    # Store all the original data in memory to compare
    original_id = original.pk
    original_author_id = original.author_id
    original_ingredient_ids = set(original.ingredients.values_list("id", flat=True))
    original_step_ids = set(original.steps.values_list("id", flat=True))
    original_tag_names = list(original.tags.order_by("_order").values_list("name", flat=True))
    original_ingredient_names = list(
        original.ingredients.order_by("_order").values_list("name", flat=True)
    )
    original_step_descriptions = list(
        original.steps.order_by("_order").values_list("description", flat=True)
    )
    original_step_ingredient_names = {
        step.description: sorted(ing.name for ing in step.ingredients.all())
        for step in original.steps.all()
    }

    clone = original.clone(cloner)
    clone.refresh_from_db()

    # Assert that the ids were properly updated/set
    assert clone.pk != original_id
    assert clone.original_recipe_id == original_id
    assert clone.original_author_id == original_author_id
    assert clone.author_id == cloner.id
    assert clone.name == "Classic Spaghetti Bolognese"

    # Assert that the tags/ingredients/steps were properly cloned with ordering preserved
    assert list(clone.tags.order_by("_order").values_list("name", flat=True)) == original_tag_names
    assert (
        list(clone.ingredients.order_by("_order").values_list("name", flat=True))
        == original_ingredient_names
    )
    assert (
        list(clone.steps.order_by("_order").values_list("description", flat=True))
        == original_step_descriptions
    )

    # Assert that the new ideas are in fact new
    clone_ingredient_ids = set(clone.ingredients.values_list("id", flat=True))
    clone_step_ids = set(clone.steps.values_list("id", flat=True))
    assert clone_ingredient_ids.isdisjoint(original_ingredient_ids)
    assert clone_step_ids.isdisjoint(original_step_ids)

    # Assert all the links were properly created
    clone_links = RecipeStepIngredient.objects.filter(recipe=clone)
    assert clone_links.count() == RecipeStepIngredient.objects.filter(recipe_id=original_id).count()
    assert all(link.step_id in clone_step_ids for link in clone_links)
    assert all(link.ingredient_id in clone_ingredient_ids for link in clone_links)

    # Assert that the cloned step ingredient names are the same names
    cloned_step_ingredient_names = {
        step.description: sorted(ing.name for ing in step.ingredients.all())
        for step in clone.steps.all()
    }
    assert cloned_step_ingredient_names == original_step_ingredient_names

    # Make sure to check that reviews and comments were left alone
    assert clone.reviews.count() == 0
    assert clone.comments.count() == 0

    # Assert that the original and its data were properly left alone/not mutated.
    original_reloaded = Recipe.objects.get(pk=original_id)
    assert original_reloaded.ingredients.count() == len(original_ingredient_ids)
    assert original_reloaded.steps.count() == len(original_step_ids)
    assert original_reloaded.reviews.count() == 2
    assert original_reloaded.comments.count() == 3
