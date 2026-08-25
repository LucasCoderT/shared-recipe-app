import pytest
from rest_framework.test import APIClient

from core.models import ShoppingList, ShoppingListItem, User

pytestmark = pytest.mark.django_db


def test__given_more_than_a_page_of_items__then_all_are_returned():
    owner = User.objects.create_user(email="owner@example.com", password="Password@1")
    shopping_list = ShoppingList.objects.create(name="Big shop", user=owner)
    for index in range(30):
        ShoppingListItem.objects.create(shopping_list=shopping_list, name=f"Item {index}")

    client = APIClient()
    client.force_login(owner)
    response = client.get(f"/api/shopping-lists/{shopping_list.pk}/items/")

    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)
    assert len(body) == 30

    lists = client.get("/api/shopping-lists/").json()
    assert isinstance(lists, list)
    assert [entry["name"] for entry in lists] == ["Big shop"]
