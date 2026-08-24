from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from random import Random

import factory
from factory.django import DjangoModelFactory

from core.models import (
    Recipe,
    RecipeComment,
    RecipeIngredient,
    RecipePhoto,
    RecipeReview,
    RecipeStep,
    RecipeTag,
    ShoppingList,
    ShoppingListItem,
    User,
)
from core.utils.seed_data import RecipeSpec


@dataclass(frozen=True)
class SyntheticRecipePlan:
    name: str
    author: User
    ingredient_names: tuple[str, ...]
    tag_names: tuple[str, ...]
    step_count: int


class UserFactory(DjangoModelFactory):
    class Meta:
        model = User

    email = factory.Sequence(lambda n: f"user_{n:05d}@example.local")
    display_name = factory.Sequence(lambda n: f"user_{n:05d}")
    password = ""
    is_staff = False
    is_superuser = False
    is_active = True


class RecipeFactory(DjangoModelFactory):
    class Meta:
        model = Recipe

    name = factory.Sequence(lambda n: f"Recipe {n:05d}")
    author = factory.SubFactory(UserFactory)
    description = "Recipe description"


class RecipeIngredientFactory(DjangoModelFactory):
    class Meta:
        model = RecipeIngredient

    recipe = factory.SubFactory(RecipeFactory)
    name = factory.Sequence(lambda n: f"Ingredient {n:05d}")
    quantity = Decimal("1")
    unit = "gram"


class RecipeStepFactory(DjangoModelFactory):
    class Meta:
        model = RecipeStep

    recipe = factory.SubFactory(RecipeFactory)
    description = "Step description"


class RecipeTagFactory(DjangoModelFactory):
    class Meta:
        model = RecipeTag

    recipe = factory.SubFactory(RecipeFactory)
    name = factory.Sequence(lambda n: f"tag-{n:05d}")


class RecipePhotoFactory(DjangoModelFactory):
    class Meta:
        model = RecipePhoto

    recipe = factory.SubFactory(RecipeFactory)
    image = "recipe_photos/placeholder_1"
    description = ""


class RecipeReviewFactory(DjangoModelFactory):
    class Meta:
        model = RecipeReview

    recipe = factory.SubFactory(RecipeFactory)
    user = factory.SubFactory(UserFactory)
    rating = 5


class RecipeCommentFactory(DjangoModelFactory):
    class Meta:
        model = RecipeComment

    recipe = factory.SubFactory(RecipeFactory)
    user = factory.SubFactory(UserFactory)
    content = "Comment"


class ShoppingListFactory(DjangoModelFactory):
    class Meta:
        model = ShoppingList

    name = factory.Sequence(lambda n: f"Shopping List {n:05d}")
    user = factory.SubFactory(UserFactory)


class ShoppingListItemFactory(DjangoModelFactory):
    class Meta:
        model = ShoppingListItem

    shopping_list = factory.SubFactory(ShoppingListFactory)
    ingredient = factory.SubFactory(RecipeIngredientFactory)
    name = factory.Sequence(lambda n: f"Item {n:05d}")
    quantity = Decimal("1")
    unit = "gram"
    purchased = False


def _quantity_for_unit(unit: str, rng: Random) -> Decimal:
    if unit == "gram":
        return Decimal(rng.randint(20, 1200))
    if unit == "milliliter":
        return Decimal(rng.randint(30, 1500))
    if unit == "teaspoon":
        return Decimal(rng.randint(1, 12))
    if unit == "tablespoon":
        return Decimal(rng.randint(1, 8))
    return Decimal(rng.randint(1, 12))


def _slugify_recipe_name(name: str) -> str:
    return name.lower().replace(" ", "_").replace("-", "_").replace("#", "")


def build_user(seed_user: dict[str, str], password_hash: str, now=None) -> User:
    _ = now
    return UserFactory.build(
        email=seed_user["email"],
        display_name=seed_user["username"],
        password=password_hash,
    )


def build_load_user(index: int, password_hash: str, now=None) -> User:
    _ = now
    handle = f"cook_{index:05d}"
    return UserFactory.build(
        email=f"{handle}@example.local",
        display_name=handle,
        password=password_hash,
    )


def build_recipe(spec: RecipeSpec, author: User, now=None) -> Recipe:
    _ = now
    return RecipeFactory.build(
        name=spec.name,
        author=author,
        description=spec.description,
    )


def build_ordered_ingredients(
    recipe: Recipe,
    ingredient_specs: tuple[tuple[str, str, str], ...],
    now=None,
) -> list[RecipeIngredient]:
    _ = now
    return [
        RecipeIngredientFactory.build(
            recipe=recipe,
            name=name,
            quantity=Decimal(quantity),
            unit=unit,
            _order=order,
        )
        for order, (name, quantity, unit) in enumerate(ingredient_specs)
    ]


def build_ordered_steps(
    recipe: Recipe,
    step_specs: tuple[tuple[str, tuple[str, ...]], ...],
    now=None,
) -> list[RecipeStep]:
    _ = now
    return [
        RecipeStepFactory.build(
            recipe=recipe,
            description=description,
            _order=order,
        )
        for order, (description, _) in enumerate(step_specs)
    ]


def build_ordered_tags(
    recipe: Recipe,
    tags: tuple[str, ...],
    now=None,
) -> list[RecipeTag]:
    _ = now
    return [
        RecipeTagFactory.build(
            recipe=recipe,
            name=tag,
            _order=order,
        )
        for order, tag in enumerate(tags)
    ]


def build_recipe_photos(recipe: Recipe, spec: RecipeSpec, now=None) -> list[RecipePhoto]:
    _ = now
    slug = _slugify_recipe_name(spec.name)
    photos = [
        RecipePhotoFactory.build(
            recipe=recipe,
            image="recipe_photos/placeholder_1.jpg",
            description=f"Plated {spec.name.lower()}",
            _order=0,
        )
    ]
    if spec.name in {"Classic Spaghetti Bolognese", "Chicken Tikka Masala"}:
        photos.append(
            RecipePhotoFactory.build(
                recipe=recipe,
                image="recipe_photos/placeholder_2.jpg",
                description="In-progress cooking photo",
                _order=1,
            )
        )
    return photos


def build_reviews(
    recipe: Recipe,
    usernames_and_ratings: tuple[tuple[str, int], ...],
    users_by_username: dict[str, User],
    now=None,
) -> list[RecipeReview]:
    _ = now
    return [
        RecipeReviewFactory.build(
            recipe=recipe,
            user=users_by_username[username],
            rating=rating,
        )
        for username, rating in usernames_and_ratings
    ]


def build_comments(
    recipe: Recipe,
    contents: tuple[str, ...],
    users_by_username: dict[str, User],
    commenter_usernames: list[str],
    now=None,
) -> list[RecipeComment]:
    _ = now
    return [
        RecipeCommentFactory.build(
            recipe=recipe,
            user=users_by_username[commenter_usernames[index % len(commenter_usernames)]],
            content=content,
        )
        for index, content in enumerate(contents)
    ]


def build_shopping_list(user: User, title: str, now=None) -> ShoppingList:
    _ = now
    return ShoppingListFactory.build(
        name=f"{user.display_name} {title}",
        user=user,
    )


def build_shopping_item(
    shopping_list: ShoppingList,
    ingredient: RecipeIngredient,
    order: int,
    rng: Random,
    now=None,
) -> ShoppingListItem:
    _ = now
    return ShoppingListItemFactory.build(
        shopping_list=shopping_list,
        ingredient=ingredient if rng.random() > 0.2 else None,
        name=ingredient.name if rng.random() > 0.1 else f"Extra {ingredient.name}",
        quantity=ingredient.quantity if rng.random() > 0.25 else None,
        unit=ingredient.unit,
        purchased=rng.random() > 0.7,
        _order=order,
    )


def build_synthetic_plan(
    index: int,
    authors: list[User],
    rng: Random,
    tag_pool: list[str],
    ingredient_names: list[str],
    dish_bases: tuple[str, ...],
    preparations: tuple[str, ...],
) -> SyntheticRecipePlan:
    prep = preparations[(index - 1) % len(preparations)]
    dish = dish_bases[((index - 1) // len(preparations)) % len(dish_bases)]
    ingredient_count = min(rng.randint(6, 14), len(ingredient_names))
    step_count = rng.randint(3, 7)
    return SyntheticRecipePlan(
        name=f"{prep} {dish} #{index:06d}",
        author=authors[rng.randrange(len(authors))],
        ingredient_names=tuple(rng.sample(ingredient_names, k=ingredient_count)),
        tag_names=tuple(rng.sample(tag_pool, k=rng.randint(2, min(5, len(tag_pool))))),
        step_count=step_count,
    )


def build_synthetic_recipe(plan: SyntheticRecipePlan, now=None) -> Recipe:
    _ = now
    return RecipeFactory.build(
        name=plan.name,
        author=plan.author,
        description=(
            f"Synthetic load recipe for query testing. "
            f"Built from {len(plan.ingredient_names)} ingredients and {plan.step_count} steps."
        ),
    )
