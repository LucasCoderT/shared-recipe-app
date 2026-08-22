from decimal import Decimal

from rest_framework import serializers

from core.models import (
    Recipe,
    RecipeComment,
    RecipeIngredient,
    RecipePhoto,
    RecipeReview,
    RecipeStep,
    RecipeStepIngredient,
    RecipeTag,
)

from .base import (
    TimestampedModelSerializer,
    validate_nonblank_text,
    validate_optional_text,
    validate_positive_decimal,
)


class RecipeSerializer(TimestampedModelSerializer):
    author = serializers.PrimaryKeyRelatedField(read_only=True)
    original_author = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Recipe
        fields = (
            "id",
            "created_at",
            "updated_at",
            "name",
            "author",
            "description",
            "original_recipe",
            "original_author",
        )
        read_only_fields = ("id", "created_at", "updated_at", "author", "original_author")

    def validate_name(self, value: str) -> str:
        return validate_nonblank_text(value=value, field_name="Name")

    def validate_description(self, value: str) -> str:
        return validate_nonblank_text(value=value, field_name="Description")

    def validate_original_recipe(self, value: Recipe) -> Recipe:
        if self.instance is not None and value.pk == self.instance.pk:
            raise serializers.ValidationError(
                "A recipe cannot reference itself as its original recipe."
            )
        return value


class RecipeGridCardSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    rating = serializers.FloatField(source="average_rating", read_only=True, allow_null=True)
    tags = serializers.SerializerMethodField()

    class Meta:
        model = Recipe
        fields = ("id", "image", "name", "rating", "tags")

    def get_image(self, obj: Recipe) -> str | None:
        photo = next(iter(getattr(obj, "ordered_photos", [])), None)
        if photo is None:
            return None

        request = self.context.get("request")
        image_url = photo.image.url
        if request is None:
            return image_url
        return request.build_absolute_uri(image_url)

    def get_tags(self, obj: Recipe) -> list[str]:
        return [tag.name for tag in getattr(obj, "ordered_tags", [])[:3]]


class RecipeGridQuerySerializer(serializers.Serializer):
    q = serializers.CharField(required=False)
    tag = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        help_text="Repeat the parameter or pass a comma-separated list.",
    )
    minRating = serializers.FloatField(required=False)
    sort = serializers.ChoiceField(
        choices=["name", "-name", "rating", "-rating", "createdAt", "-createdAt"],
        required=False,
    )

    def validate_tag(self, value: list[str]) -> list[str]:
        return [
            tag.strip()
            for raw_value in value
            for tag in raw_value.split(",")
            if tag.strip()
        ]


class RecipeTagSerializer(TimestampedModelSerializer):
    position = serializers.IntegerField(read_only=True)

    class Meta:
        model = RecipeTag
        fields = ("id", "created_at", "updated_at", "recipe", "name", "position")
        read_only_fields = ("id", "created_at", "updated_at", "recipe", "position")

    def validate_name(self, value: str) -> str:
        return validate_nonblank_text(value=value, field_name="Tag name")


class RecipeIngredientSerializer(TimestampedModelSerializer):
    position = serializers.IntegerField(read_only=True)
    quantity = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal("0.01"),
    )

    class Meta:
        model = RecipeIngredient
        fields = (
            "id",
            "created_at",
            "updated_at",
            "recipe",
            "name",
            "quantity",
            "unit",
            "position",
        )
        read_only_fields = ("id", "created_at", "updated_at", "recipe", "position")

    def validate_name(self, value: str) -> str:
        return validate_nonblank_text(value=value, field_name="Ingredient name")

    def validate_quantity(self, value: Decimal) -> Decimal:
        validated = validate_positive_decimal(value=value, field_name="Quantity")
        assert validated is not None
        return validated


class RecipePhotoSerializer(TimestampedModelSerializer):
    position = serializers.IntegerField(read_only=True)

    class Meta:
        model = RecipePhoto
        fields = ("id", "created_at", "updated_at", "recipe", "image", "description", "position")
        read_only_fields = ("id", "created_at", "updated_at", "recipe", "position")

    def validate_description(self, value: str) -> str:
        return validate_optional_text(value)


class RecipeReviewSerializer(TimestampedModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    rating = serializers.IntegerField(min_value=1, max_value=5)

    class Meta:
        model = RecipeReview
        fields = ("id", "created_at", "updated_at", "recipe", "user", "rating")
        read_only_fields = ("id", "created_at", "updated_at", "recipe", "user")


class RecipeCommentSerializer(TimestampedModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = RecipeComment
        fields = ("id", "created_at", "updated_at", "recipe", "user", "content")
        read_only_fields = ("id", "created_at", "updated_at", "recipe", "user")

    def validate_content(self, value: str) -> str:
        return validate_nonblank_text(value=value, field_name="Content")


class RecipeStepSerializer(TimestampedModelSerializer):
    position = serializers.IntegerField(read_only=True)
    ingredient_ids = serializers.PrimaryKeyRelatedField(
        source="ingredients",
        many=True,
        read_only=True,
    )

    class Meta:
        model = RecipeStep
        fields = (
            "id",
            "created_at",
            "updated_at",
            "recipe",
            "description",
            "position",
            "ingredient_ids",
        )
        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
            "recipe",
            "position",
            "ingredient_ids",
        )

    def validate_description(self, value: str) -> str:
        return validate_nonblank_text(value=value, field_name="Description")


class RecipeStepIngredientSerializer(TimestampedModelSerializer):
    class Meta:
        model = RecipeStepIngredient
        fields = ("id", "created_at", "updated_at", "recipe", "step", "ingredient")
        read_only_fields = ("id", "created_at", "updated_at", "recipe")

    def validate(self, attrs):
        recipe = attrs.get("recipe")
        if recipe is None:
            recipe = self.context.get("recipe", getattr(self.instance, "recipe", None))
        step = attrs.get("step", getattr(self.instance, "step", None))
        ingredient = attrs.get("ingredient", getattr(self.instance, "ingredient", None))

        if recipe is None or step is None or ingredient is None:
            return attrs

        errors = {}
        if step.recipe_id != recipe.id:
            errors["step"] = "Step must belong to the selected recipe."
        if ingredient.recipe_id != recipe.id:
            errors["ingredient"] = "Ingredient must belong to the selected recipe."
        if errors:
            raise serializers.ValidationError(errors)
        return attrs


class FullRecipeSerializer(RecipeSerializer):
    ingredients = RecipeIngredientSerializer(many=True, read_only=True)
    steps = RecipeStepSerializer(many=True, read_only=True)
    tags = RecipeTagSerializer(many=True, read_only=True)
    photos = RecipePhotoSerializer(many=True, read_only=True)
    reviews = RecipeReviewSerializer(many=True, read_only=True)
    comments = RecipeCommentSerializer(many=True, read_only=True)

    class Meta:
        model = Recipe
        fields = (
            "id",
            "created_at",
            "updated_at",
            "name",
            "author",
            "description",
            "original_recipe",
            "original_author",
            "ingredients",
            "steps",
            "tags",
            "photos",
            "reviews",
            "comments"
        )
        read_only_fields = ("id", "created_at", "updated_at", "author", "original_recipe", "original_author")
