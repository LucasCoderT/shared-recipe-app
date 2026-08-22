from django.db.models import Avg, FloatField, OuterRef, Prefetch, QuerySet, Subquery
from drf_spectacular.utils import extend_schema
from rest_framework.decorators import action
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response

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
from core.serializers import (
    RecipeCommentSerializer,
    RecipeGridCardSerializer,
    RecipeGridQuerySerializer,
    RecipeIngredientSerializer,
    RecipePhotoSerializer,
    RecipeReviewSerializer,
    RecipeSerializer,
    RecipeStepIngredientSerializer,
    RecipeStepSerializer,
    RecipeTagSerializer,
    FullRecipeSerializer,
)

from .base import OwnedResourceViewSet, RecipeNestedViewSet, ensure_recipe_owned


class RecipeViewSet(OwnedResourceViewSet):
    queryset = Recipe.objects.prefetch_related(
        "ingredients",
        "steps",
        "tags",
        "photos",
        "reviews",
        "comments"
    ).all()
    serializer_class = FullRecipeSerializer
    recipe_grid_sort_fields = {
        "name": "name",
        "-name": "-name",
        "rating": "average_rating",
        "-rating": "-average_rating",
        "createdAt": "created_at",
        "-createdAt": "-created_at",
    }


    def get_recipe_grid_queryset(self) -> QuerySet[Recipe]:
        average_rating_subquery = (
            RecipeReview.objects.filter(recipe=OuterRef("pk"))
            .values("recipe")
            .annotate(value=Avg("rating"))
            .values("value")[:1]
        )
        queryset = (
            Recipe.objects.select_related("author")
            .annotate(
                average_rating=Subquery(average_rating_subquery, output_field=FloatField())
            )
            .prefetch_related(
                Prefetch(
                    "recipe_photos",
                    queryset=RecipePhoto.objects.order_by("_order"),
                    to_attr="ordered_photos",
                ),
                Prefetch(
                    "recipe_tags",
                    queryset=RecipeTag.objects.order_by("_order"),
                    to_attr="ordered_tags",
                ),
            )
        )

        filters = RecipeGridQuerySerializer(data=self.request.query_params)
        filters.is_valid(raise_exception=True)
        validated_filters = filters.validated_data

        if query := validated_filters.get("q"):
            queryset = queryset.filter(name__icontains=query)

        if min_rating := validated_filters.get("minRating"):
            queryset = queryset.filter(average_rating__gte=min_rating)

        tags = validated_filters.get("tag", [])
        if tags:
            for tag in tags:
                queryset = queryset.filter(recipe_tags__name__iexact=tag)
            queryset = queryset.distinct()

        sort = validated_filters.get("sort", "name")
        return queryset.order_by(
            self.recipe_grid_sort_fields.get(sort, "name"),
            "-created_at",
        )

    @extend_schema(
        operation_id="recipesGrid",
        parameters=[RecipeGridQuerySerializer],
        responses=RecipeGridCardSerializer(many=True),
    )
    @action(detail=False, methods=["get"], url_path="grid")
    def grid(self, request) -> Response:
        queryset = self.get_recipe_grid_queryset()
        page = self.paginate_queryset(queryset)
        serializer = RecipeGridCardSerializer(
            page if page is not None else queryset,
            many=True,
            context=self.get_serializer_context(),
        )
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)

    @extend_schema(
        operation_id="cloneRecipe",

    )
    @action(detail=True, methods=["post"], url_path="clone")
    def clone(self, request, pk) -> Response:
        recipe = get_object_or_404(self.queryset, pk=pk)
        new_recipe = recipe.clone(request.user)
        return new_recipe



class RecipeTagViewSet(RecipeNestedViewSet):
    queryset = RecipeTag.objects.select_related("recipe", "recipe__author").all()
    serializer_class = RecipeTagSerializer

    def perform_create(self, serializer) -> None:
        recipe = self.get_parent_recipe()
        ensure_recipe_owned(user=self.request.user, recipe=recipe)
        serializer.save(recipe=recipe)


class RecipeIngredientViewSet(RecipeNestedViewSet):
    queryset = RecipeIngredient.objects.select_related("recipe", "recipe__author").all()
    serializer_class = RecipeIngredientSerializer

    def perform_create(self, serializer) -> None:
        recipe = self.get_parent_recipe()
        ensure_recipe_owned(user=self.request.user, recipe=recipe)
        serializer.save(recipe=recipe)


class RecipePhotoViewSet(RecipeNestedViewSet):
    queryset = RecipePhoto.objects.select_related("recipe", "recipe__author").all()
    serializer_class = RecipePhotoSerializer

    def perform_create(self, serializer) -> None:
        recipe = self.get_parent_recipe()
        ensure_recipe_owned(user=self.request.user, recipe=recipe)
        serializer.save(recipe=recipe)


class RecipeReviewViewSet(RecipeNestedViewSet):
    queryset = RecipeReview.objects.select_related("recipe", "recipe__author", "user").all()
    serializer_class = RecipeReviewSerializer

    def perform_create(self, serializer) -> None:
        serializer.save(recipe=self.get_parent_recipe(), user=self.request.user)


class RecipeCommentViewSet(RecipeNestedViewSet):
    queryset = RecipeComment.objects.select_related("recipe", "recipe__author", "user").all()
    serializer_class = RecipeCommentSerializer

    def perform_create(self, serializer) -> None:
        serializer.save(recipe=self.get_parent_recipe(), user=self.request.user)


class RecipeStepViewSet(RecipeNestedViewSet):
    queryset = RecipeStep.objects.select_related("recipe", "recipe__author").prefetch_related(
        "ingredients"
    )
    serializer_class = RecipeStepSerializer

    def perform_create(self, serializer) -> None:
        recipe = self.get_parent_recipe()
        ensure_recipe_owned(user=self.request.user, recipe=recipe)
        serializer.save(recipe=recipe)


class RecipeStepIngredientViewSet(RecipeNestedViewSet):
    queryset = RecipeStepIngredient.objects.select_related(
        "recipe",
        "recipe__author",
        "step",
        "ingredient",
    ).all()
    serializer_class = RecipeStepIngredientSerializer

    def perform_create(self, serializer) -> None:
        recipe = self.get_parent_recipe()
        ensure_recipe_owned(user=self.request.user, recipe=recipe)
        serializer.save(recipe=recipe)
