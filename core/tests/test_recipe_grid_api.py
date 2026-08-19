from __future__ import annotations

import pytest
from django.contrib.auth.models import User
from django.test import Client, override_settings

from core.models import Recipe, RecipePhoto, RecipeReview, RecipeTag

pytestmark = pytest.mark.django_db


@override_settings(MEDIA_URL="/media/")
def test__recipe_grid_returns_image_name_rating_and_first_three_tags_in_order() -> None:
    owner = User.objects.create_user("owner", password="recipe-pass")
    recipe = Recipe.objects.create(name="Lasagna", author=owner, description="Layers.")
    RecipePhoto.objects.create(recipe=recipe, image="recipe_photos/lasagna-1.jpg", description="")
    RecipePhoto.objects.create(recipe=recipe, image="recipe_photos/lasagna-2.jpg", description="")
    RecipeTag.objects.create(recipe=recipe, name="Comfort")
    RecipeTag.objects.create(recipe=recipe, name="Pasta")
    RecipeTag.objects.create(recipe=recipe, name="Dinner")
    RecipeTag.objects.create(recipe=recipe, name="Extra")
    RecipeReview.objects.create(recipe=recipe, user=owner, rating=4)

    response = Client().get("/api/recipes/grid/")

    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 1
    assert body["results"][0] == {
        "id": recipe.pk,
        "image": "http://testserver/media/recipe_photos/lasagna-1.jpg",
        "name": "Lasagna",
        "rating": 4.0,
        "tags": ["Comfort", "Pasta", "Dinner"],
    }


def test__recipe_grid_supports_sorting_and_filtering() -> None:
    owner = User.objects.create_user("owner", password="recipe-pass")
    curry = Recipe.objects.create(name="Curry", author=owner, description="Spicy.")
    pasta = Recipe.objects.create(name="Pasta", author=owner, description="Creamy.")
    salad = Recipe.objects.create(name="Salad", author=owner, description="Fresh.")

    RecipeTag.objects.create(recipe=curry, name="Spicy")
    RecipeTag.objects.create(recipe=pasta, name="Comfort")
    RecipeTag.objects.create(recipe=salad, name="Fresh")
    RecipeTag.objects.create(recipe=salad, name="Vegetarian")

    RecipeReview.objects.create(recipe=curry, user=owner, rating=5)
    RecipeReview.objects.create(recipe=pasta, user=owner, rating=3)
    RecipeReview.objects.create(recipe=salad, user=owner, rating=4)

    client = Client()

    rating_response = client.get("/api/recipes/grid/?sort=-rating")
    filter_response = client.get("/api/recipes/grid/?tag=Fresh&minRating=4&q=sal")

    assert rating_response.status_code == 200
    assert [recipe["name"] for recipe in rating_response.json()["results"]] == [
        "Curry",
        "Salad",
        "Pasta",
    ]

    assert filter_response.status_code == 200
    assert filter_response.json()["count"] == 1
    assert filter_response.json()["results"][0]["name"] == "Salad"


def test__recipe_grid_allows_repeated_tag_filters() -> None:
    owner = User.objects.create_user("owner", password="recipe-pass")
    both = Recipe.objects.create(name="Chili", author=owner, description="Rich.")
    Recipe.objects.create(name="Toast", author=owner, description="Simple.")

    RecipeTag.objects.create(recipe=both, name="Quick")
    RecipeTag.objects.create(recipe=both, name="Dinner")

    response = Client().get("/api/recipes/grid/?tag=Quick&tag=Dinner")

    assert response.status_code == 200
    assert response.json()["count"] == 1
    assert response.json()["results"][0]["name"] == "Chili"
