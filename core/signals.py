from django.apps import apps
from django.contrib.auth.models import User
from django.db.models.signals import post_migrate, post_save

from core.auth_groups import assign_default_groups_to_users, ensure_default_groups


def create_default_groups(sender, **kwargs) -> None:
    if sender is not apps.get_app_config("core"):
        return
    ensure_default_groups()


def assign_groups_to_new_user(sender, instance: User, created: bool, **kwargs) -> None:
    if not created:
        return
    assign_default_groups_to_users([instance])


post_migrate.connect(create_default_groups, dispatch_uid="core.create_default_groups")
post_save.connect(
    assign_groups_to_new_user,
    sender=User,
    dispatch_uid="core.assign_groups_to_new_user",
)
