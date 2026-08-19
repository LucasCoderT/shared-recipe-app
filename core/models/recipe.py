from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from core.models import base
from core.units import normalize_unit, validate_unit


class RecipeTag(base.OrderableModelMixin, base.TimestampedModel):
    recipe = models.ForeignKey("Recipe", on_delete=models.CASCADE, related_name="recipe_tags")
    name = models.CharField(max_length=50)

    class Meta:
        verbose_name = "Recipe Tag"
        verbose_name_plural = "Recipe Tags"
        order_with_respect_to = "recipe"
        constraints = [
            models.UniqueConstraint(fields=["recipe", "name"], name="uniq_tag_per_recipe"),
            models.UniqueConstraint(
                fields=["recipe", "_order"],
                name="uniq_order_per_recipe_tag",
                deferrable=models.Deferrable.DEFERRED,
            ),
        ]

    def __str__(self):
        return self.name


class RecipeComment(base.TimestampedModel):
    recipe = models.ForeignKey("Recipe", on_delete=models.CASCADE, related_name="recipe_comments")
    user = models.ForeignKey("auth.User", on_delete=models.CASCADE, related_name="recipe_comments")
    content = models.TextField()

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["recipe", "-created_at"]),
        ]

    def __str__(self):
        return f"Comment by {self.user.username} on {self.recipe.name}"


class RecipeReview(base.TimestampedModel):
    recipe = models.ForeignKey("Recipe", on_delete=models.CASCADE, related_name="recipe_reviews")
    user = models.ForeignKey("auth.User", on_delete=models.CASCADE, related_name="recipe_reviews")
    rating = models.IntegerField(
        null=True, blank=True, validators=[MinValueValidator(0), MaxValueValidator(5)]
    )

    def __str__(self):
        return f"Review for {self.recipe.name}"

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["recipe", "user"], name="uniq_review_per_user_per_recipe"
            ),
        ]
        indexes = [
            models.Index(fields=["recipe", "rating"]),
        ]


class RecipeStep(base.OrderableModelMixin, base.TimestampedModel):
    recipe = models.ForeignKey("Recipe", on_delete=models.CASCADE, related_name="recipe_steps")
    description = models.TextField()
    ingredients = models.ManyToManyField(
        "RecipeIngredient",
        through="RecipeStepIngredient",
        related_name="steps",
    )

    class Meta:
        order_with_respect_to = "recipe"
        constraints = [
            models.UniqueConstraint(
                fields=["recipe", "_order"],
                name="uniq_order_per_recipe_step",
                deferrable=models.Deferrable.DEFERRED,
            ),
        ]

    def __str__(self):
        return f"Step {self.position}"


class RecipeStepIngredient(base.TimestampedModel):
    recipe = models.ForeignKey("Recipe", on_delete=models.CASCADE, related_name="step_ingredients")
    step = models.ForeignKey(
        "RecipeStep", on_delete=models.CASCADE, related_name="step_ingredient_links"
    )
    ingredient = models.ForeignKey(
        "RecipeIngredient",
        on_delete=models.CASCADE,
        related_name="ingredient_step_links",
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["step", "ingredient"], name="uniq_step_ingredient"),
        ]


class RecipeIngredient(base.OrderableModelMixin, base.TimestampedModel):
    recipe = models.ForeignKey(
        "Recipe", on_delete=models.CASCADE, related_name="recipe_ingredients"
    )
    name = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=50, validators=[validate_unit])

    class Meta:
        order_with_respect_to = "recipe"
        constraints = [
            models.UniqueConstraint(
                fields=["recipe", "_order"],
                name="uniq_order_per_recipe_ingredient",
                deferrable=models.Deferrable.DEFERRED,
            ),
        ]

    def clean(self):
        super().clean()
        self.unit = normalize_unit(self.unit)

    def save(self, *args, **kwargs):
        self.unit = normalize_unit(self.unit)
        return super().save(*args, **kwargs)


class RecipePhoto(base.OrderableModelMixin, base.TimestampedModel):
    recipe = models.ForeignKey("Recipe", on_delete=models.CASCADE, related_name="recipe_photos")
    image = models.ImageField(upload_to="recipe_photos/")
    description = models.TextField(blank=True)

    class Meta:
        order_with_respect_to = "recipe"
        constraints = [
            models.UniqueConstraint(
                fields=["recipe", "_order"],
                name="uniq_order_per_recipe_photo",
                deferrable=models.Deferrable.DEFERRED,
            ),
        ]

    def __str__(self):
        return f"Photo for {self.recipe.name}"


class Recipe(base.TimestampedModel):
    name = models.CharField(max_length=255)
    author = models.ForeignKey("auth.User", on_delete=models.CASCADE, related_name="recipes")
    description = models.TextField()
    original_recipe = models.ForeignKey(
        "self", on_delete=models.SET_NULL, null=True, blank=True, related_name="derivatives"
    )
    original_author = models.ForeignKey(
        "auth.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="original_recipes",
    )

    class Meta:
        ordering = ["name", "-created_at"]
        indexes = [
            models.Index(fields=["author", "-created_at"]),
        ]

    def __str__(self):
        return self.name
