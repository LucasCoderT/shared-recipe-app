import pytest
from rest_framework.test import APIClient

from core.models import Recipe, RecipeComment, User

pytestmark = pytest.mark.django_db


def test__given_a_copied_recipe__then_detail_names_the_original_and_its_author():
    ava = User.objects.create_user(
        email="ava@example.com", password="Password@1", display_name="Ava"
    )
    nina = User.objects.create_user(email="nina@example.com", password="Password@1")
    original = Recipe.objects.create(name="Bolognese", author=ava)
    copy = Recipe.objects.get(pk=original.pk).clone(nina)

    body = APIClient().get(f"/api/recipes/{copy.pk}/").json()

    assert body["originalRecipe"] == original.pk
    assert body["originalRecipeName"] == "Bolognese"
    assert body["originalAuthorName"] == "Ava"
    assert body["authorName"] == "nina@example.com"

    # The original can go away; the credit to Ava must not.
    original.delete()
    body = APIClient().get(f"/api/recipes/{copy.pk}/").json()
    assert body["originalRecipe"] is None
    assert body["originalRecipeName"] is None
    assert body["originalAuthorName"] == "Ava"


def test__given_comments__then_detail_names_each_commenter():
    author = User.objects.create_user(email="author@example.com", password="Password@1")
    commenter = User.objects.create_user(
        email="c@example.com", password="Password@1", display_name="Casey"
    )
    recipe = Recipe.objects.create(name="Chili", author=author)
    RecipeComment.objects.create(recipe=recipe, user=commenter, content="Great")

    body = APIClient().get(f"/api/recipes/{recipe.pk}/").json()

    assert body["comments"][0]["userName"] == "Casey"
