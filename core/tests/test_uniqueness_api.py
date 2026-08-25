import pytest
from rest_framework.test import APIClient

from core.models import Recipe, User

pytestmark = pytest.mark.django_db


@pytest.fixture
def author():
    return User.objects.create_user(email="author@example.com", password="Password@1")


@pytest.fixture
def reviewer():
    return User.objects.create_user(email="reviewer@example.com", password="Password@1")


@pytest.fixture
def recipe(author):
    return Recipe.objects.create(name="Bolognese", author=author)


def _client(user: User) -> APIClient:
    client = APIClient()
    client.force_login(user)
    return client


def test__given_existing_tag__then_duplicate_post_is_a_400_not_a_500(author, recipe):
    client = _client(author)
    url = f"/api/recipes/{recipe.pk}/tags/"

    assert client.post(url, {"name": "Spicy"}, format="json").status_code == 201

    duplicate = client.post(url, {"name": "spicy"}, format="json")
    assert duplicate.status_code == 400
    assert duplicate.json() == {"name": ["This recipe already has that tag."]}
    assert recipe.tags.count() == 1


def test__given_existing_review__then_second_post_is_a_400_and_patch_works(recipe, reviewer):
    client = _client(reviewer)
    url = f"/api/recipes/{recipe.pk}/reviews/"

    first = client.post(url, {"rating": 4}, format="json")
    assert first.status_code == 201

    second = client.post(url, {"rating": 5}, format="json")
    assert second.status_code == 400
    assert "already reviewed" in second.json()["rating"][0]
    assert recipe.reviews.count() == 1

    changed = client.patch(f"{url}{first.json()['id']}/", {"rating": 5}, format="json")
    assert changed.status_code == 200
    assert changed.json()["rating"] == 5
