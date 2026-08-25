import pytest
from rest_framework.test import APIClient

from core.models import Recipe, RecipeReview, RecipeTag, User

pytestmark = pytest.mark.django_db


def _user(email: str) -> User:
    return User.objects.create_user(email=email, password="Password@1")


def _rated(recipe: Recipe, *ratings: int) -> None:
    for index, rating in enumerate(ratings):
        RecipeReview.objects.create(
            recipe=recipe, user=_user(f"reviewer{recipe.pk}_{index}@example.com"), rating=rating
        )


@pytest.fixture
def grid_recipes():
    author = _user("author@example.com")
    unrated = Recipe.objects.create(name="Unrated", author=author)
    low = Recipe.objects.create(name="Low", author=author)
    high = Recipe.objects.create(name="High", author=author)
    _rated(low, 2)
    _rated(high, 5, 4)
    return {"unrated": unrated, "low": low, "high": high}


def _names(response) -> list[str]:
    return [card["name"] for card in response.json()["results"]]


def test__given_unrated_recipes__then_highest_rated_sort_puts_them_last(grid_recipes):
    response = APIClient().get("/api/recipes/grid/", {"sort": "-rating"})
    assert response.status_code == 200
    assert _names(response) == ["High", "Low", "Unrated"]


def test__given_unrated_recipes__then_lowest_rated_sort_also_puts_them_last(grid_recipes):
    response = APIClient().get("/api/recipes/grid/", {"sort": "rating"})
    assert response.status_code == 200
    assert _names(response) == ["Low", "High", "Unrated"]


def test__given_more_than_three_tags__then_card_shows_first_three_in_order(grid_recipes):
    recipe = grid_recipes["high"]
    for name in ("one", "two", "three", "four", "five"):
        RecipeTag.objects.create(recipe=recipe, name=name)

    response = APIClient().get("/api/recipes/grid/", {"q": "High"})
    assert response.status_code == 200
    (card,) = response.json()["results"]
    assert card["tags"] == ["one", "two", "three"]
    assert card["rating"] == 4.5
