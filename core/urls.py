from django.urls import path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.routers import DefaultRouter
from rest_framework_nested.routers import NestedSimpleRouter

from core import views

app_name = "core"

router = DefaultRouter()
router.register("recipes", views.RecipeViewSet, basename="recipe")
router.register("shopping-lists", views.ShoppingListViewSet, basename="shopping-list")

recipe_router = NestedSimpleRouter(router, "recipes", lookup="recipe")
recipe_router.register("tags", views.RecipeTagViewSet, basename="recipe-tag")
recipe_router.register("ingredients", views.RecipeIngredientViewSet, basename="recipe-ingredient")
recipe_router.register("photos", views.RecipePhotoViewSet, basename="recipe-photo")
recipe_router.register("reviews", views.RecipeReviewViewSet, basename="recipe-review")
recipe_router.register("comments", views.RecipeCommentViewSet, basename="recipe-comment")
recipe_router.register("steps", views.RecipeStepViewSet, basename="recipe-step")
recipe_router.register(
    "step-ingredients",
    views.RecipeStepIngredientViewSet,
    basename="recipe-step-ingredient",
)

shopping_list_router = NestedSimpleRouter(router, "shopping-lists", lookup="shopping_list")
shopping_list_router.register("items", views.ShoppingListItemViewSet, basename="shopping-list-item")

urlpatterns = [
    path("health/", views.HealthView.as_view(), name="health"),
    path("whoami/", views.WhoAmIView.as_view(), name="whoami"),
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    path("docs/", SpectacularSwaggerView.as_view(url_name="core:schema"), name="docs"),
    *router.urls,
    *recipe_router.urls,
    *shopping_list_router.urls,
]
