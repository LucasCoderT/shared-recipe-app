from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import AdminUserCreationForm, UserChangeForm

from core.models import (
    Recipe,
    RecipeComment,
    RecipeIngredient,
    RecipePhoto,
    RecipeReview,
    RecipeStep,
    RecipeStepIngredient,
    RecipeTag,
    ShoppingList,
    ShoppingListItem,
    User,
)


@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    pass


@admin.register(RecipeTag)
class RecipeTagAdmin(admin.ModelAdmin):
    pass


@admin.register(RecipeStep)
class RecipeStepAdmin(admin.ModelAdmin):
    pass


@admin.register(RecipeStepIngredient)
class RecipeStepIngredientAdmin(admin.ModelAdmin):
    pass


@admin.register(RecipeIngredient)
class RecipeIngredientAdmin(admin.ModelAdmin):
    pass


@admin.register(RecipePhoto)
class RecipePhotoAdmin(admin.ModelAdmin):
    pass


@admin.register(RecipeReview)
class RecipeReviewAdmin(admin.ModelAdmin):
    pass


@admin.register(RecipeComment)
class RecipeCommentAdmin(admin.ModelAdmin):
    pass


@admin.register(ShoppingList)
class ShoppingListAdmin(admin.ModelAdmin):
    pass


@admin.register(ShoppingListItem)
class ShoppingListItemAdmin(admin.ModelAdmin):
    pass


class UserCreationForm(AdminUserCreationForm):
    """Admin add-form for the email-first user.

    Django's stock form is bound to the username field, so the model and fields
    are repointed at email here. The parent still supplies the optional
    unusable-password path, which matches how registration creates accounts.
    """

    class Meta(AdminUserCreationForm.Meta):
        model = User
        fields = ("email", "display_name")


class UserAdminChangeForm(UserChangeForm):
    class Meta(UserChangeForm.Meta):
        model = User
        fields = "__all__"


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    add_form = UserCreationForm
    form = UserAdminChangeForm
    model = User

    # BaseUserAdmin's defaults all reference username, so every attribute that
    # names a field has to be restated.
    ordering = ("email",)
    list_display = ("email", "display_name", "is_staff", "is_active", "created_at")
    list_filter = ("is_staff", "is_superuser", "is_active", "groups")
    search_fields = ("email", "display_name")
    readonly_fields = ("last_login", "created_at", "updated_at")
    filter_horizontal = ("groups", "user_permissions")

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Profile", {"fields": ("display_name",)}),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Dates", {"fields": ("last_login", "created_at", "updated_at")}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "display_name", "usable_password", "password1", "password2"),
            },
        ),
    )
