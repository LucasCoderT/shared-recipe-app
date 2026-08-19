import json

import pytest
from django.contrib.auth.models import Group, User
from django.test import Client

from core.auth_groups import (
    ADMIN_GROUP,
    DEFAULT_USER_GROUPS,
    RECIPE_EDITORS_GROUP,
    RECIPE_INTERACTORS_GROUP,
    SHOPPING_LIST_EDITORS_GROUP,
)
from core.models import Recipe, RecipeComment, RecipeIngredient, ShoppingList, ShoppingListItem

pytestmark = pytest.mark.django_db


def add_user_to_group(user: User, group_name: str) -> None:
    user.groups.add(Group.objects.get(name=group_name))


def test__given_anonymous_client__then_recipe_and_shopping_list_reads_are_public() -> None:
    owner = User.objects.create_user("owner", password="recipe-pass")
    Recipe.objects.create(name="Toast", author=owner, description="Simple toast.")
    ShoppingList.objects.create(name="Weekend", user=owner)

    recipe_response = Client().get("/api/recipes/")
    shopping_list_response = Client().get("/api/shopping-lists/")

    assert recipe_response.status_code == 200
    assert recipe_response.json()["count"] == 1
    assert recipe_response.json()["results"][0]["author"] == owner.pk
    assert shopping_list_response.status_code == 200
    assert shopping_list_response.json()["count"] == 1
    assert shopping_list_response.json()["results"][0]["user"] == owner.pk


def test__given_authenticated_owner__then_recipe_create_update_and_delete_use_current_user(
) -> None:
    owner = User.objects.create_user("owner", password="recipe-pass")
    stranger = User.objects.create_user("stranger", password="recipe-pass")
    add_user_to_group(owner, RECIPE_EDITORS_GROUP)
    client = Client()
    client.force_login(owner)

    create_response = client.post(
        "/api/recipes/",
        data=json.dumps(
            {
                "name": "Soup",
                "description": "A good soup.",
                "author": stranger.pk,
            }
        ),
        content_type="application/json",
    )

    recipe_id = create_response.json()["id"]
    update_response = client.patch(
        f"/api/recipes/{recipe_id}/",
        data=json.dumps({"name": "Better Soup"}),
        content_type="application/json",
    )
    delete_response = client.delete(f"/api/recipes/{recipe_id}/")

    assert create_response.status_code == 201
    assert create_response.json()["author"] == owner.pk
    assert update_response.status_code == 200
    assert update_response.json()["name"] == "Better Soup"
    assert delete_response.status_code == 204
    assert not Recipe.objects.filter(pk=recipe_id).exists()


def test__given_non_owner__then_recipe_update_and_delete_are_forbidden() -> None:
    owner = User.objects.create_user("owner", password="recipe-pass")
    intruder = User.objects.create_user("intruder", password="recipe-pass")
    add_user_to_group(intruder, RECIPE_EDITORS_GROUP)
    recipe = Recipe.objects.create(name="Pie", author=owner, description="Apple pie.")
    client = Client()
    client.force_login(intruder)

    update_response = client.patch(
        f"/api/recipes/{recipe.pk}/",
        data=json.dumps({"description": "Now mine."}),
        content_type="application/json",
    )
    delete_response = client.delete(f"/api/recipes/{recipe.pk}/")

    assert update_response.status_code == 403
    assert delete_response.status_code == 403
    recipe.refresh_from_db()
    assert recipe.description == "Apple pie."


def test__given_recipe_owner__then_only_that_owner_can_manage_recipe_ingredients() -> None:
    owner = User.objects.create_user("owner", password="recipe-pass")
    intruder = User.objects.create_user("intruder", password="recipe-pass")
    add_user_to_group(owner, RECIPE_EDITORS_GROUP)
    add_user_to_group(intruder, RECIPE_EDITORS_GROUP)
    recipe = Recipe.objects.create(name="Cake", author=owner, description="Chocolate.")
    owner_client = Client()
    intruder_client = Client()
    owner_client.force_login(owner)
    intruder_client.force_login(intruder)

    create_response = owner_client.post(
        f"/api/recipes/{recipe.pk}/ingredients/",
        data=json.dumps({"name": "Flour", "quantity": "2.00", "unit": "cups"}),
        content_type="application/json",
    )
    ingredient_id = create_response.json()["id"]
    intruder_create_response = intruder_client.post(
        f"/api/recipes/{recipe.pk}/ingredients/",
        data=json.dumps({"name": "Sugar", "quantity": "1.00", "unit": "cup"}),
        content_type="application/json",
    )
    intruder_update_response = intruder_client.patch(
        f"/api/recipes/{recipe.pk}/ingredients/{ingredient_id}/",
        data=json.dumps({"name": "Stolen Flour"}),
        content_type="application/json",
    )

    assert create_response.status_code == 201
    assert create_response.json()["position"] == 1
    assert create_response.json()["recipe"] == recipe.pk
    assert intruder_create_response.status_code == 403
    assert intruder_update_response.status_code == 403
    assert RecipeIngredient.objects.filter(recipe=recipe).count() == 1


def test__given_shopping_list_owner__then_only_that_owner_can_manage_items() -> None:
    owner = User.objects.create_user("owner", password="recipe-pass")
    intruder = User.objects.create_user("intruder", password="recipe-pass")
    add_user_to_group(owner, SHOPPING_LIST_EDITORS_GROUP)
    add_user_to_group(intruder, SHOPPING_LIST_EDITORS_GROUP)
    shopping_list = ShoppingList.objects.create(name="Groceries", user=owner)
    owner_client = Client()
    intruder_client = Client()
    owner_client.force_login(owner)
    intruder_client.force_login(intruder)

    create_response = owner_client.post(
        f"/api/shopping-lists/{shopping_list.pk}/items/",
        data=json.dumps(
            {
                "name": "Milk",
                "quantity": "1.00",
                "unit": "liter",
                "purchased": False,
            }
        ),
        content_type="application/json",
    )
    item_id = create_response.json()["id"]
    intruder_create_response = intruder_client.post(
        f"/api/shopping-lists/{shopping_list.pk}/items/",
        data=json.dumps(
            {
                "name": "Eggs",
                "quantity": "12",
                "unit": "count",
                "purchased": False,
            }
        ),
        content_type="application/json",
    )
    intruder_delete_response = intruder_client.delete(
        f"/api/shopping-lists/{shopping_list.pk}/items/{item_id}/"
    )

    assert create_response.status_code == 201
    assert create_response.json()["shoppingList"] == shopping_list.pk
    assert intruder_create_response.status_code == 403
    assert intruder_delete_response.status_code == 403
    assert ShoppingListItem.objects.filter(shopping_list=shopping_list).count() == 1


def test__given_recipe_comment_author__then_only_that_author_can_edit_comment() -> None:
    recipe_owner = User.objects.create_user("recipe-owner", password="recipe-pass")
    comment_author = User.objects.create_user("comment-author", password="recipe-pass")
    intruder = User.objects.create_user("intruder", password="recipe-pass")
    add_user_to_group(comment_author, RECIPE_INTERACTORS_GROUP)
    add_user_to_group(intruder, RECIPE_INTERACTORS_GROUP)
    recipe = Recipe.objects.create(name="Bread", author=recipe_owner, description="Fresh bread.")
    comment = RecipeComment.objects.create(
        recipe=recipe,
        user=comment_author,
        content="Looks great.",
    )
    author_client = Client()
    intruder_client = Client()
    author_client.force_login(comment_author)
    intruder_client.force_login(intruder)

    create_response = author_client.post(
        f"/api/recipes/{recipe.pk}/comments/",
        data=json.dumps({"content": "Tastes great too."}),
        content_type="application/json",
    )
    intruder_update_response = intruder_client.patch(
        f"/api/recipes/{recipe.pk}/comments/{comment.pk}/",
        data=json.dumps({"content": "Actually I own this."}),
        content_type="application/json",
    )

    assert create_response.status_code == 201
    assert create_response.json()["recipe"] == recipe.pk
    assert create_response.json()["user"] == comment_author.pk
    assert intruder_update_response.status_code == 403
    comment.refresh_from_db()
    assert comment.content == "Looks great."


def test__given_owner_without_required_group__then_recipe_update_is_forbidden() -> None:
    owner = User.objects.create_user("owner", password="recipe-pass")
    owner.groups.clear()
    recipe = Recipe.objects.create(name="Curry", author=owner, description="Spicy.")
    client = Client()
    client.force_login(owner)

    response = client.patch(
        f"/api/recipes/{recipe.pk}/",
        data=json.dumps({"description": "Still spicy."}),
        content_type="application/json",
    )

    assert response.status_code == 403


def test__given_superuser__then_recipe_and_nested_shopping_list_writes_bypass_groups_and_ownership(
) -> None:
    owner = User.objects.create_user("owner", password="recipe-pass")
    recipe = Recipe.objects.create(name="Lasagna", author=owner, description="Layers.")
    shopping_list = ShoppingList.objects.create(name="Party", user=owner)
    admin = User.objects.create_superuser("admin", "admin@example.com", "admin-pass")
    client = Client()
    client.force_login(admin)

    recipe_update_response = client.patch(
        f"/api/recipes/{recipe.pk}/",
        data=json.dumps({"description": "Admin updated this."}),
        content_type="application/json",
    )
    shopping_item_create_response = client.post(
        f"/api/shopping-lists/{shopping_list.pk}/items/",
        data=json.dumps(
            {
                "name": "Soda",
                "quantity": "2.00",
                "unit": "liter",
                "purchased": False,
            }
        ),
        content_type="application/json",
    )

    assert recipe_update_response.status_code == 200
    assert shopping_item_create_response.status_code == 201
    recipe.refresh_from_db()
    assert recipe.description == "Admin updated this."
    assert ShoppingListItem.objects.filter(shopping_list=shopping_list, name="Soda").exists()


def test__default_groups__have_expected_permissions() -> None:
    admin_group = Group.objects.get(name=ADMIN_GROUP)
    recipe_editors = Group.objects.get(name=RECIPE_EDITORS_GROUP)
    recipe_interactors = Group.objects.get(name=RECIPE_INTERACTORS_GROUP)
    shopping_editors = Group.objects.get(name=SHOPPING_LIST_EDITORS_GROUP)

    assert admin_group.permissions.filter(codename="add_recipe").exists()
    assert admin_group.permissions.filter(codename="add_recipecomment").exists()
    assert admin_group.permissions.filter(codename="change_shoppinglist").exists()
    assert recipe_editors.permissions.filter(codename="add_recipe").exists()
    assert recipe_editors.permissions.filter(codename="change_recipeingredient").exists()
    assert recipe_interactors.permissions.filter(codename="add_recipecomment").exists()
    assert recipe_interactors.permissions.filter(codename="delete_recipereview").exists()
    assert shopping_editors.permissions.filter(codename="change_shoppinglist").exists()
    assert shopping_editors.permissions.filter(codename="delete_shoppinglistitem").exists()


def test__given_staff_user__then_recipe_writes_bypass_groups_and_ownership() -> None:
    owner = User.objects.create_user("owner2", "owner2@example.com", "pass")
    recipe = Recipe.objects.create(name="Stew", author=owner, description="Hearty stew.")
    staff = User.objects.create_user("staff-user", "staff@example.com", "pass", is_staff=True)
    client = Client()
    client.force_login(staff)

    response = client.patch(
        f"/api/recipes/{recipe.pk}/",
        data=json.dumps({"description": "Staff updated this."}),
        content_type="application/json",
    )

    assert response.status_code == 200
    recipe.refresh_from_db()
    assert recipe.description == "Staff updated this."


def test__given_admin_group_member__then_recipe_writes_bypass_groups_and_ownership() -> None:
    owner = User.objects.create_user("owner3", "owner3@example.com", "pass")
    recipe = Recipe.objects.create(name="Pie", author=owner, description="Sweet pie.")
    admin_user = User.objects.create_user("admin-group-user", "admingroup@example.com", "pass")
    admin_user.groups.add(Group.objects.get(name=ADMIN_GROUP))
    client = Client()
    client.force_login(admin_user)

    response = client.patch(
        f"/api/recipes/{recipe.pk}/",
        data=json.dumps({"description": "Admin group updated this."}),
        content_type="application/json",
    )

    assert response.status_code == 200
    recipe.refresh_from_db()
    assert recipe.description == "Admin group updated this."


def test__given_new_user__then_post_save_assigns_all_default_groups() -> None:
    user = User.objects.create_user("new-user", password="recipe-pass")

    assert set(user.groups.values_list("name", flat=True)) == set(DEFAULT_USER_GROUPS)


def test__given_new_superuser_or_staff__then_post_save_skips_default_groups() -> None:
    admin = User.objects.create_superuser("admin-2", "admin2@example.com", "admin-pass")
    staff = User.objects.create_user("staff-2", "staff2@example.com", "staff-pass", is_staff=True)

    assert list(admin.groups.values_list("name", flat=True)) == []
    assert list(staff.groups.values_list("name", flat=True)) == []
