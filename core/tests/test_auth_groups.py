import pytest
from django.contrib.auth.models import User

from core.auth_groups import DEFAULT_USER_GROUPS

pytestmark = pytest.mark.django_db


def test__given_seeded_users__then_bulk_created_users_receive_default_groups(
    seed_data_factory,
    seed_data_payload,
) -> None:
    seed_data_factory(recipes=0, authors=2)

    usernames = {user["username"] for user in seed_data_payload.users} | {
        "cook_00001",
        "cook_00002",
    }
    users = User.objects.filter(username__in=usernames).prefetch_related("groups")

    assert users.count() == len(usernames)
    for user in users:
        assert set(user.groups.values_list("name", flat=True)) == set(DEFAULT_USER_GROUPS)
