import pytest
from django.test import Client

from core.models import User

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
    user = User.objects.create_user("lucas@example.com", password="pw", is_staff=True)
    client = Client()
    client.force_login(user)

    body = client.get("/api/whoami/").json()

    assert body["isStaff"] is True
    assert "is_staff" not in body
    assert body["email"] == "lucas@example.com"
    assert "displayName" in body
