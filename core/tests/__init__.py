import pytest
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.test import Client

from core.models import RecipeIngredient

# ATOMIC_REQUESTS wraps every request in a transaction, so any view test hits the db.
pytestmark = pytest.mark.django_db


def test__given_anonymous_client__then_health_returns_ok() -> None:
    response = Client().get("/api/health/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test__given_anonymous_client__then_whoami_reports_logged_out() -> None:
    response = Client().get("/api/whoami/")
    assert response.status_code == 200
    assert response.json() == {"authenticated": False}


def test__given_staff_user__then_whoami_uses_camel_case_fields() -> None:
    user = User.objects.create_user("lucas", password="pw", is_staff=True)
    client = Client()
    client.force_login(user)

    body = client.get("/api/whoami/").json()

    assert body["isStaff"] is True
    assert "is_staff" not in body


def test__given_valid_pint_unit__then_save_normalizes_unit() -> None:
    ingredient = RecipeIngredient.objects.create(name="Flour", quantity="250", unit="gram")

    assert ingredient.unit == "gram"


def test__given_invalid_pint_unit__then_save_raises_validation_error() -> None:
    with pytest.raises(ValidationError):
        RecipeIngredient.objects.create(
            name="Mystery Ingredient",
            quantity="1",
            unit="not-a-real-unit",
        )
