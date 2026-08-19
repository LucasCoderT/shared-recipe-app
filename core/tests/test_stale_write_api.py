"""Stale-write detection tests.

Every PATCH/PUT/DELETE can include the ``updatedAt`` token the client originally
loaded. The server compares it against the locked DB row; a mismatch returns 409.
Omitting the token bypasses the check (backward-compatible).
A provided-but-malformed token returns 400 so the client knows it broke.
"""
import json
import threading

import pytest
from django.contrib.auth.models import Group, User
from django.test import Client

from core.auth_groups import RECIPE_EDITORS_GROUP, SHOPPING_LIST_EDITORS_GROUP
from core.models import Recipe, ShoppingList

pytestmark = pytest.mark.django_db


def add_user_to_group(user: User, group_name: str) -> None:
    user.groups.add(Group.objects.get(name=group_name))


# ── Update (PATCH) — token behaviour ─────────────────────────────────────────


def test__given_stale_updated_at__recipe_update_returns_409() -> None:
    owner = User.objects.create_user("owner", password="pw")
    add_user_to_group(owner, RECIPE_EDITORS_GROUP)
    recipe = Recipe.objects.create(name="Soup", author=owner, description="Good soup.")
    client = Client()
    client.force_login(owner)

    old_ts = client.get(f"/api/recipes/{recipe.pk}/").json()["updatedAt"]

    # A first write advances the DB's updated_at.
    assert (
        client.patch(
            f"/api/recipes/{recipe.pk}/",
            data=json.dumps({"name": "Updated Soup"}),
            content_type="application/json",
        ).status_code
        == 200
    )

    # Second request sends the now-stale token → 409.
    response = client.patch(
        f"/api/recipes/{recipe.pk}/",
        data=json.dumps({"name": "Stale Soup", "updatedAt": old_ts}),
        content_type="application/json",
    )
    assert response.status_code == 409


def test__given_current_updated_at__recipe_update_succeeds() -> None:
    owner = User.objects.create_user("owner", password="pw")
    add_user_to_group(owner, RECIPE_EDITORS_GROUP)
    recipe = Recipe.objects.create(name="Soup", author=owner, description="Good soup.")
    client = Client()
    client.force_login(owner)

    current_ts = client.get(f"/api/recipes/{recipe.pk}/").json()["updatedAt"]

    response = client.patch(
        f"/api/recipes/{recipe.pk}/",
        data=json.dumps({"name": "Good Soup", "updatedAt": current_ts}),
        content_type="application/json",
    )
    assert response.status_code == 200


def test__given_no_updated_at__update_proceeds_without_check() -> None:
    owner = User.objects.create_user("owner", password="pw")
    add_user_to_group(owner, RECIPE_EDITORS_GROUP)
    recipe = Recipe.objects.create(name="Soup", author=owner, description="Good soup.")
    client = Client()
    client.force_login(owner)

    response = client.patch(
        f"/api/recipes/{recipe.pk}/",
        data=json.dumps({"name": "Updated Soup"}),
        content_type="application/json",
    )
    assert response.status_code == 200


def test__given_js_millisecond_precision_token__update_succeeds() -> None:
    """JS Date drops sub-millisecond digits; the comparison must tolerate that."""
    owner = User.objects.create_user("owner", password="pw")
    add_user_to_group(owner, RECIPE_EDITORS_GROUP)
    recipe = Recipe.objects.create(name="Soup", author=owner, description="Good soup.")
    client = Client()
    client.force_login(owner)

    full_ts = client.get(f"/api/recipes/{recipe.pk}/").json()["updatedAt"]
    # Simulate what a JS Date round-trip does: truncate to 3 decimal places.
    # e.g. "2026-08-19T15:12:27.330699-06:00" → "2026-08-19T15:12:27.330-06:00"
    from django.utils.dateparse import parse_datetime

    parsed = parse_datetime(full_ts)
    assert parsed is not None
    ms_only = parsed.replace(microsecond=(parsed.microsecond // 1000) * 1000)
    js_ts = ms_only.isoformat()

    response = client.patch(
        f"/api/recipes/{recipe.pk}/",
        data=json.dumps({"name": "JS Soup", "updatedAt": js_ts}),
        content_type="application/json",
    )
    assert response.status_code == 200, response.json()


def test__given_malformed_updated_at__update_returns_400() -> None:
    """An unparseable token must surface as 400, not silently disable the check."""
    owner = User.objects.create_user("owner", password="pw")
    add_user_to_group(owner, RECIPE_EDITORS_GROUP)
    recipe = Recipe.objects.create(name="Soup", author=owner, description="Good soup.")
    client = Client()
    client.force_login(owner)

    response = client.patch(
        f"/api/recipes/{recipe.pk}/",
        data=json.dumps({"name": "Soup", "updatedAt": "not-a-date"}),
        content_type="application/json",
    )
    assert response.status_code == 400


def test__given_naive_updated_at__update_returns_400() -> None:
    """A timezone-naive token must be rejected rather than silently interpreted."""
    owner = User.objects.create_user("owner", password="pw")
    add_user_to_group(owner, RECIPE_EDITORS_GROUP)
    recipe = Recipe.objects.create(name="Soup", author=owner, description="Good soup.")
    client = Client()
    client.force_login(owner)

    response = client.patch(
        f"/api/recipes/{recipe.pk}/",
        data=json.dumps({"name": "Soup", "updatedAt": "2026-08-19T15:12:27"}),
        content_type="application/json",
    )
    assert response.status_code == 400


def test__given_stale_updated_at__shopping_list_update_returns_409() -> None:
    owner = User.objects.create_user("owner", password="pw")
    add_user_to_group(owner, SHOPPING_LIST_EDITORS_GROUP)
    sl = ShoppingList.objects.create(name="Weekly", user=owner)
    client = Client()
    client.force_login(owner)

    old_ts = client.get(f"/api/shopping-lists/{sl.pk}/").json()["updatedAt"]

    client.patch(
        f"/api/shopping-lists/{sl.pk}/",
        data=json.dumps({"name": "Weekend"}),
        content_type="application/json",
    )

    response = client.patch(
        f"/api/shopping-lists/{sl.pk}/",
        data=json.dumps({"name": "Stale List", "updatedAt": old_ts}),
        content_type="application/json",
    )
    assert response.status_code == 409


# ── DELETE — token behaviour ──────────────────────────────────────────────────


def test__given_stale_updated_at__recipe_delete_returns_409() -> None:
    owner = User.objects.create_user("owner", password="pw")
    add_user_to_group(owner, RECIPE_EDITORS_GROUP)
    recipe = Recipe.objects.create(name="Soup", author=owner, description="Good soup.")
    client = Client()
    client.force_login(owner)

    old_ts = client.get(f"/api/recipes/{recipe.pk}/").json()["updatedAt"]

    # Advance updated_at.
    client.patch(
        f"/api/recipes/{recipe.pk}/",
        data=json.dumps({"name": "Updated Soup"}),
        content_type="application/json",
    )

    response = client.delete(
        f"/api/recipes/{recipe.pk}/",
        data=json.dumps({"updatedAt": old_ts}),
        content_type="application/json",
    )
    assert response.status_code == 409
    assert Recipe.objects.filter(pk=recipe.pk).exists()


def test__given_current_updated_at__recipe_delete_succeeds() -> None:
    owner = User.objects.create_user("owner", password="pw")
    add_user_to_group(owner, RECIPE_EDITORS_GROUP)
    recipe = Recipe.objects.create(name="Soup", author=owner, description="Good soup.")
    client = Client()
    client.force_login(owner)

    current_ts = client.get(f"/api/recipes/{recipe.pk}/").json()["updatedAt"]

    response = client.delete(
        f"/api/recipes/{recipe.pk}/",
        data=json.dumps({"updatedAt": current_ts}),
        content_type="application/json",
    )
    assert response.status_code == 204
    assert not Recipe.objects.filter(pk=recipe.pk).exists()


def test__given_no_updated_at__delete_proceeds_without_check() -> None:
    owner = User.objects.create_user("owner", password="pw")
    add_user_to_group(owner, RECIPE_EDITORS_GROUP)
    recipe = Recipe.objects.create(name="Soup", author=owner, description="Good soup.")
    client = Client()
    client.force_login(owner)

    response = client.delete(f"/api/recipes/{recipe.pk}/")
    assert response.status_code == 204


# ── Concurrent-race test ───────────────────────────────────────────────────────


@pytest.mark.django_db(transaction=True)
def test__concurrent_updates_with_same_token__only_one_wins() -> None:
    """Two threads both hold the original updated_at token and fire simultaneously.

    select_for_update serializes the DB writes: whichever transaction commits
    first wins with 200; the second reads the updated timestamp, finds a mismatch,
    and gets 409.
    """
    # User creation triggers post_save → ensure_default_groups + group assignment,
    # so no explicit add_user_to_group is needed when transaction=True flushes groups.
    owner = User.objects.create_user("owner", password="pw")
    recipe = Recipe.objects.create(name="Soup", author=owner, description="Warm soup.")

    old_ts = Client().get(f"/api/recipes/{recipe.pk}/").json()["updatedAt"]

    statuses: list[int] = []
    results_lock = threading.Lock()
    barrier = threading.Barrier(2)

    def do_update(name: str) -> None:
        from django.db import connection as db_conn

        barrier.wait()  # release both threads at the same instant
        c = Client()
        c.force_login(owner)
        r = c.patch(
            f"/api/recipes/{recipe.pk}/",
            data=json.dumps({"name": name, "updatedAt": old_ts}),
            content_type="application/json",
        )
        with results_lock:
            statuses.append(r.status_code)
        db_conn.close()  # release the thread's connection before teardown

    t1 = threading.Thread(target=do_update, args=("Alpha",))
    t2 = threading.Thread(target=do_update, args=("Beta",))
    t1.start()
    t2.start()
    t1.join(timeout=10)
    t2.join(timeout=10)

    assert sorted(statuses) == [200, 409], (
        f"Expected exactly one 200 and one 409, got {statuses}"
    )
