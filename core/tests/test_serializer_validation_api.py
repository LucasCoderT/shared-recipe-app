import json

import pytest
from django.contrib.auth.models import Group, User
from django.test import Client

from core.auth_groups import (
    RECIPE_EDITORS_GROUP,
    RECIPE_INTERACTORS_GROUP,
    SHOPPING_LIST_EDITORS_GROUP,
)
from core.models import Recipe, ShoppingList

pytestmark = pytest.mark.django_db


def add_user_to_group(user: User, group_name: str) -> None:
    user.groups.add(Group.objects.get(name=group_name))


def test__recipe_review_rejects_ratings_outside_1_to_5() -> None:
    owner = User.objects.create_user("owner", password="recipe-pass")
    reviewer = User.objects.create_user("reviewer", password="recipe-pass")
    add_user_to_group(reviewer, RECIPE_INTERACTORS_GROUP)
    recipe = Recipe.objects.create(name="Soup", author=owner, description="Warm soup.")
    client = Client()
    client.force_login(reviewer)

    low_response = client.post(
        f"/api/recipes/{recipe.pk}/reviews/",
        data=json.dumps({"rating": 0}),
        content_type="application/json",
    )
    high_response = client.post(
        f"/api/recipes/{recipe.pk}/reviews/",
        data=json.dumps({"rating": 6}),
        content_type="application/json",
    )

    assert low_response.status_code == 400
    assert high_response.status_code == 400
    assert "rating" in low_response.json()
    assert "rating" in high_response.json()


def test__recipe_create_rejects_blank_trimmed_fields() -> None:
    owner = User.objects.create_user("owner", password="recipe-pass")
    add_user_to_group(owner, RECIPE_EDITORS_GROUP)
    client = Client()
    client.force_login(owner)

    response = client.post(
        "/api/recipes/",
        data=json.dumps({"name": "   ", "description": "   "}),
        content_type="application/json",
    )

    assert response.status_code == 400
    assert "name" in response.json()
    assert "description" in response.json()


def test__recipe_ingredient_rejects_non_positive_quantity() -> None:
    owner = User.objects.create_user("owner", password="recipe-pass")
    add_user_to_group(owner, RECIPE_EDITORS_GROUP)
    recipe = Recipe.objects.create(name="Cake", author=owner, description="Chocolate cake.")
    client = Client()
    client.force_login(owner)

    response = client.post(
        f"/api/recipes/{recipe.pk}/ingredients/",
        data=json.dumps({"name": "Flour", "quantity": "0.00", "unit": "cup"}),
        content_type="application/json",
    )

    assert response.status_code == 400
    assert "quantity" in response.json()


def test__shopping_list_item_rejects_blank_name_and_non_positive_quantity() -> None:
    owner = User.objects.create_user("owner", password="recipe-pass")
    add_user_to_group(owner, SHOPPING_LIST_EDITORS_GROUP)
    shopping_list = ShoppingList.objects.create(name="Groceries", user=owner)
    client = Client()
    client.force_login(owner)

    response = client.post(
        f"/api/shopping-lists/{shopping_list.pk}/items/",
        data=json.dumps({"name": "   ", "quantity": "-1.00", "unit": "count", "purchased": False}),
        content_type="application/json",
    )

    assert response.status_code == 400
    assert "name" in response.json()
    assert "quantity" in response.json()


def test__recipe_comment_rejects_blank_content() -> None:
    owner = User.objects.create_user("owner", password="recipe-pass")
    commenter = User.objects.create_user("commenter", password="recipe-pass")
    add_user_to_group(commenter, RECIPE_INTERACTORS_GROUP)
    recipe = Recipe.objects.create(name="Bread", author=owner, description="Fresh bread.")
    client = Client()
    client.force_login(commenter)

    response = client.post(
        f"/api/recipes/{recipe.pk}/comments/",
        data=json.dumps({"content": "   "}),
        content_type="application/json",
    )

    assert response.status_code == 400
    assert "content" in response.json()
