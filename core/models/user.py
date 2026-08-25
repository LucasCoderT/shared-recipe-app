from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models

from core.models import base


class UserManager(BaseUserManager):

    use_in_migrations = True

    def _create_user(self, email: str, password: str | None = None, **extra_fields):
        if not email:
            raise ValueError("An email address is required.")

        email = self.normalize_email(email).strip().lower()
        user = self.model(email=email, **extra_fields)

        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()

        user.save(using=self._db)
        return user

    def create_user(self, email: str, password: str | None = None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email: str, password: str | None = None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("A superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("A superuser must have is_superuser=True.")

        return self._create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin, base.TimestampedModel):
    """
    Custom user model that uses email as the unique identifier instead of username.

    Implemented Because AUTH_USER_MODEL is harder to change once data exists,
    and this is a new project, we can implement this now.

    This is implemented to allow for a more flexible authentication system
    where users can log in using their email address.
    """
    email = models.EmailField(unique=True)
    display_name = models.CharField(
        max_length=150,
        blank=True,
        help_text="Shown instead of the email address wherever a name is needed.",
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(
        default=False,
        help_text="Whether this account can sign in to the Django admin.",
    )

    objects = UserManager()

    USERNAME_FIELD = "email"
    # Empty because email is already the USERNAME_FIELD and is prompted for
    # separately by createsuperuser.
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering = ["email"]

    def __str__(self) -> str:
        return self.display_name or self.email

    def get_full_name(self) -> str:
        return self.display_name or self.email

    def get_short_name(self) -> str:
        return self.display_name or self.email
