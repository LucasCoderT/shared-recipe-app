from django.contrib import admin

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
