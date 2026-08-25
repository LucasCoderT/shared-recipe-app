from django.conf import settings
from django.contrib.auth.base_user import AbstractBaseUser
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models, transaction

from core.models import base
from core.utils.units import normalize_unit, validate_unit


class RecipeTag(base.OrderableModelMixin, base.TimestampedModel):
    recipe = models.ForeignKey("Recipe", on_delete=models.CASCADE, related_name="tags")
    name = models.CharField(max_length=50)

    class Meta:
        verbose_name = "Recipe Tag"
        verbose_name_plural = "Recipe Tags"
        order_with_respect_to = "recipe"
        constraints = [
            models.UniqueConstraint(fields=["recipe", "name"], name="uniq_tag_per_recipe"),
            # Deferred constraint to allow reordering of tags without
            # violating the unique order constraint
            # Since deferred constraints are not applied until the end of the transaction
            models.UniqueConstraint(
                fields=["recipe", "_order"],
                name="uniq_order_per_recipe_tag",
                deferrable=models.Deferrable.DEFERRED,
            ),
        ]

    def __str__(self):
        return self.name


class RecipeComment(base.TimestampedModel):
    recipe = models.ForeignKey("Recipe", on_delete=models.CASCADE, related_name="comments")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="recipe_comments"
    )
    content = models.TextField()

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["recipe", "-created_at"]),
        ]

    def __str__(self):
        return f"Comment by {self.user} on {self.recipe.name}"


class RecipeReview(base.TimestampedModel):
    recipe = models.ForeignKey("Recipe", on_delete=models.CASCADE, related_name="reviews")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="recipe_reviews"
    )
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
    recipe = models.ForeignKey("Recipe", on_delete=models.CASCADE, related_name="steps")
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
    recipe = models.ForeignKey("Recipe", on_delete=models.CASCADE, related_name="ingredients")
    name = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=50, blank=True, validators=[validate_unit])

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
    recipe = models.ForeignKey("Recipe", on_delete=models.CASCADE, related_name="photos")
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
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="recipes"
    )
    description = models.TextField(blank=True)
    original_recipe = models.ForeignKey(
        "self", on_delete=models.SET_NULL, null=True, blank=True, related_name="derivatives"
    )
    original_author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
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

    def clone(self, user: AbstractBaseUser) -> "Recipe":
        """
        Creates a copy of the recipe, including its related tags, photos, ingredients, and steps.
        The new recipe will have the specified user as its author, and the original recipe and
        author will be recorded in the new recipe's original_recipe and original_author fields.
        Args:
            user: The user who is cloning the recipe.
            This user will be set as the author of the new recipe.

        Returns:
            the current instance of the Recipe model,
            which is modified to represent the cloned recipe.
        """
        with transaction.atomic():
            relations = [
                "tags",
                "photos",
            ]

            # Cache all children entites before changing the primary key of the recipe instance
            children_entities = {child: list(getattr(self, child).all()) for child in relations}

            # Update the current instance to represent the cloned recipe
            self.original_author = self.author
            self.original_recipe_id = self.pk
            self.author = user
            self.pk = None
            self.id = None
            # Drop the source recipe's prefetched children; this instance is the
            # copy now and must not answer .tags/.photos with the original's rows.
            self._prefetched_objects_cache = {}

            self.save()

            # Clone the related entities (tags and photos) for the new recipe
            for children in children_entities.values():
                for child in children:
                    child.pk = None
                    child.id = None
                    child.recipe = self
                    child.save()


            # Clone the ingredients and steps for the new recipe,
            # maintaining the relationships between them
            ingredients = {}
            for ingredient in RecipeIngredient.objects.filter(recipe_id=self.original_recipe_id):
                old_id = ingredient.pk
                ingredient.pk = None
                ingredient.recipe = self
                ingredient.save()
                ingredients[old_id] = ingredient


            # Clone the steps and maintain the relationships between steps and ingredients
            steps = {}
            for step in RecipeStep.objects.filter(recipe_id=self.original_recipe_id):
                old_id = step.pk
                step.pk = None
                step.recipe = self
                step.save()
                steps[old_id] = step


            # Clone the RecipeStepIngredient relationships for the new recipe,
            # linking the cloned steps and ingredients
            for link in RecipeStepIngredient.objects.filter(recipe_id=self.original_recipe_id):
                RecipeStepIngredient.objects.create(
                    recipe=self,
                    step=steps[link.step_id],
                    ingredient=ingredients[link.ingredient_id],
                )

            return self
