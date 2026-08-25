from django.apps import apps
from django.conf import settings
from django.db.models.signals import post_migrate, post_save, pre_save
from django.dispatch.dispatcher import receiver

from core.auth_groups import assign_default_groups_to_users, ensure_default_groups
from core.exceptions import TooManyRecipeTags
from core.models import RecipeTag


@receiver(post_migrate)
def create_default_groups(sender, **kwargs) -> None:
    if sender is not apps.get_app_config("core"):
        return
    ensure_default_groups()


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def assign_groups_to_new_user(sender, instance, created: bool, **kwargs) -> None:
    if not created:
        return
    assign_default_groups_to_users([instance])


@receiver(pre_save, sender=RecipeTag)
def ensure_tag_limit(sender, instance: RecipeTag, **kwargs) -> None:
    """
    Pre save signal to ensure that a recipe does not have more than 5 tags.
    Args:
        sender: The model class.
        instance: The instance being saved.
        **kwargs: Additional keyword arguments.

    Raises:
        TooManyRecipeTags: If the recipe has more than 5 tags.

    """
    # Counted with a fresh query to always be up to date with the database,
    # in case of concurrent saves.
    if instance.pk is None and RecipeTag.objects.filter(recipe_id=instance.recipe_id).count() >= 5:
        raise TooManyRecipeTags("A recipe can have a maximum of 5 tags.")
