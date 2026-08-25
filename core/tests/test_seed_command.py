import pytest

from core.models import Recipe

pytestmark = pytest.mark.django_db


def test__given_curated_seed__then_it_contains_one_honest_copy(seed_data_factory):
    seed_data_factory(recipes=0)

    copies = list(Recipe.objects.filter(original_recipe__isnull=False).select_related("author"))
    assert len(copies) == 1
    (copy,) = copies

    assert copy.name == "Classic Spaghetti Bolognese"
    assert copy.original_recipe.name == "Classic Spaghetti Bolognese"
    assert copy.author.email == "nina@example.com"
    assert copy.original_author == copy.original_recipe.author
    assert list(copy.tags.values_list("name", flat=True)) == list(
        copy.original_recipe.tags.values_list("name", flat=True)
    )
    assert copy.photos.count() == copy.original_recipe.photos.count()
