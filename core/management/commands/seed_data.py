from __future__ import annotations

from itertools import batched
from random import Random

from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand
from django.db import transaction

from core.auth_groups import assign_default_groups_to_users
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
from core.utils.seed_data import load_seed_payload
from core.utils.seed_factories import (
    _quantity_for_unit,
    build_comments,
    build_load_user,
    build_ordered_ingredients,
    build_ordered_steps,
    build_ordered_tags,
    build_recipe,
    build_recipe_photos,
    build_reviews,
    build_shopping_item,
    build_shopping_list,
    build_synthetic_plan,
    build_synthetic_recipe,
    build_user,
)
from core.utils.seed_photos import copy_placeholder_photos, placeholder_photo

DEFAULT_RECIPES = 500
DEFAULT_AUTHORS = 300
DEFAULT_INSERT_BATCH = 1_000
DEFAULT_RECIPE_CHUNK = 500
DEFAULT_SHOPPING_LISTS = 0


class Command(BaseCommand):
    help = "Seed curated demo data plus scalable synthetic load data."

    def add_arguments(self, parser):
        parser.add_argument(
            "--password",
            default="Password@1",
            help="Password for all seeded users.",
        )
        parser.add_argument(
            "--random-seed",
            type=int,
            default=20260819,
            help="Seed used for deterministic data generation.",
        )
        parser.add_argument(
            "--recipes",
            type=int,
            default=DEFAULT_RECIPES,
            help="Number of synthetic load recipes to generate.",
        )
        parser.add_argument(
            "--authors",
            type=int,
            default=DEFAULT_AUTHORS,
            help="Number of synthetic load authors to generate.",
        )
        parser.add_argument(
            "--insert-batch-size",
            type=int,
            default=DEFAULT_INSERT_BATCH,
            help="bulk_create batch_size for inserts.",
        )
        parser.add_argument(
            "--recipe-chunk-size",
            type=int,
            default=DEFAULT_RECIPE_CHUNK,
            help="How many synthetic recipes to process per in-memory chunk.",
        )
        parser.add_argument(
            "--shopping-lists",
            type=int,
            default=None,
            help=(
                "Number of synthetic shopping lists to generate. Defaults to "
                "roughly 10% of the recipe load."
            ),
        )

    @transaction.atomic
    def handle(self, *args, **options):
        recipes_requested = max(0, options["recipes"])
        authors_requested = max(1, options["authors"])
        insert_batch_size = max(1, options["insert_batch_size"])
        recipe_chunk_size = max(1, options["recipe_chunk_size"])
        shopping_lists_requested = (
            options["shopping_lists"]
            if options["shopping_lists"] is not None
            else max(0, recipes_requested // 10)
        )

        rng = Random(options["random_seed"])
        password_hash = make_password(options["password"])
        payload = load_seed_payload()

        copied_photos = copy_placeholder_photos()
        self.stdout.write(f"Copied {copied_photos} placeholder photo file(s) into MEDIA_ROOT.")

        demo_users, load_authors = self._create_users(
            password_hash=password_hash,
            authors_requested=authors_requested,
            insert_batch_size=insert_batch_size,
            users=payload.users,
        )
        demo_recipes = self._seed_curated_demo(
            insert_batch_size=insert_batch_size,
            users_by_username=demo_users,
            curated_recipes=payload.curated_recipes,
        )
        synthetic_recipes = self._seed_synthetic_load(
            insert_batch_size=insert_batch_size,
            recipe_chunk_size=recipe_chunk_size,
            recipes_requested=recipes_requested,
            shopping_lists_requested=shopping_lists_requested,
            load_authors=load_authors,
            demo_users=list(demo_users.values()),
            rng=rng,
            load_dish_bases=payload.load_dish_bases,
            load_preparations=payload.load_preparations,
            load_step_actions=payload.load_step_actions,
            curated_recipes=payload.curated_recipes,
        )

        self.stdout.write(
            self.style.SUCCESS(
                "Seeded data: "
                f"{len(demo_users) + len(load_authors)} users "
                f"({len(demo_users)} curated + {len(load_authors)} synthetic), "
                f"{demo_recipes + synthetic_recipes} recipes "
                f"({demo_recipes} curated + {synthetic_recipes} synthetic)."
            )
        )

    @staticmethod
    def _create_users(
        *,
        password_hash: str,
        authors_requested: int,
        insert_batch_size: int,
        users: tuple[dict[str, str], ...],
    ) -> tuple[dict[str, User], list[User]]:
        User.objects.filter(email__in=[user["email"] for user in users]).delete()
        User.objects.filter(email__startswith="cook_").delete()

        demo_users = [build_user(user, password_hash) for user in users]
        created_demo_users = User.objects.bulk_create(demo_users, batch_size=insert_batch_size)
        assign_default_groups_to_users(created_demo_users)

        load_users = [
            build_load_user(index, password_hash) for index in range(1, authors_requested + 1)
        ]
        created_load_users = User.objects.bulk_create(load_users, batch_size=insert_batch_size)
        assign_default_groups_to_users(created_load_users)

        return {user.display_name: user for user in created_demo_users}, created_load_users

    @staticmethod
    def _seed_curated_demo(
        *,
        insert_batch_size: int,
        users_by_username: dict[str, User],
        curated_recipes,
    ) -> int:
        recipe_rows = [
            build_recipe(spec, users_by_username[spec.author_username]) for spec in curated_recipes
        ]
        created_recipes = Recipe.objects.bulk_create(recipe_rows, batch_size=insert_batch_size)
        recipes_by_name = {recipe.name: recipe for recipe in created_recipes}

        ingredient_pool: list[RecipeIngredient] = []
        tag_rows: list[RecipeTag] = []
        photo_rows: list[RecipePhoto] = []
        review_rows: list[RecipeReview] = []
        comment_rows: list[RecipeComment] = []
        step_ingredient_rows: list[RecipeStepIngredient] = []

        for spec in curated_recipes:
            recipe = recipes_by_name[spec.name]
            created_ingredients = RecipeIngredient.objects.bulk_create(
                build_ordered_ingredients(recipe, spec.ingredients),
                batch_size=insert_batch_size,
            )
            ingredient_pool.extend(created_ingredients)
            ingredient_map = {ingredient.name: ingredient for ingredient in created_ingredients}

            created_steps = RecipeStep.objects.bulk_create(
                build_ordered_steps(recipe, spec.steps),
                batch_size=insert_batch_size,
            )
            step_ingredient_rows.extend(
                RecipeStepIngredient(
                    recipe=recipe,
                    step=step,
                    ingredient=ingredient_map[ingredient_name],
                )
                for step, (_, ingredient_names) in zip(created_steps, spec.steps, strict=False)
                for ingredient_name in ingredient_names
            )

            tag_rows.extend(build_ordered_tags(recipe, spec.tags))
            photo_rows.extend(build_recipe_photos(recipe, spec))
            review_rows.extend(build_reviews(recipe, spec.reviews, users_by_username))

            commenter_usernames = [
                user.display_name
                for user in users_by_username.values()
                if user.display_name != spec.author_username
            ]
            comment_rows.extend(
                build_comments(
                    recipe,
                    tuple(content for _, content in spec.comments),
                    users_by_username,
                    commenter_usernames,
                )
            )

        RecipeTag.objects.bulk_create(tag_rows, batch_size=insert_batch_size)
        RecipePhoto.objects.bulk_create(photo_rows, batch_size=insert_batch_size)
        RecipeStepIngredient.objects.bulk_create(step_ingredient_rows, batch_size=insert_batch_size)
        RecipeReview.objects.bulk_create(review_rows, batch_size=insert_batch_size)
        RecipeComment.objects.bulk_create(comment_rows, batch_size=insert_batch_size)

        # One real copy, made the same way a user makes one, so the "copied from"
        # banner has an honest example: Nina keeps a copy of Ava's Bolognese.
        # Fetched fresh because clone() repurposes the instance it is called on.
        Recipe.objects.get(pk=recipes_by_name["Classic Spaghetti Bolognese"].pk).clone(
            users_by_username["nina_bakes"]
        )

        shopping_list_rows = [
            build_shopping_list(user, title)
            for user in users_by_username.values()
            for title in ("Weekly Market Run", "Weekend Meal Prep")
        ]
        created_shopping_lists = ShoppingList.objects.bulk_create(
            shopping_list_rows,
            batch_size=insert_batch_size,
        )
        shopping_list_ids = [shopping_list.pk for shopping_list in created_shopping_lists]

        shopping_item_rows: list[ShoppingListItem] = []
        for shopping_list in (
            ShoppingList.objects.filter(pk__in=shopping_list_ids)
            .select_related("user")
            .order_by("id")
        ):
            list_rng = Random(f"{shopping_list.pk}:{shopping_list.user_id}")
            item_count = list_rng.randint(6, 20)
            chosen_ingredients = list_rng.sample(
                ingredient_pool,
                k=min(item_count, len(ingredient_pool)),
            )
            shopping_item_rows.extend(
                build_shopping_item(shopping_list, ingredient, order, list_rng)
                for order, ingredient in enumerate(chosen_ingredients)
            )
        ShoppingListItem.objects.bulk_create(shopping_item_rows, batch_size=insert_batch_size)

        return len(recipe_rows) + 1  # plus the copy

    @staticmethod
    def _seed_synthetic_load(
        *,
        insert_batch_size: int,
        recipe_chunk_size: int,
        recipes_requested: int,
        shopping_lists_requested: int,
        load_authors: list[User],
        demo_users: list[User],
        rng: Random,
        load_dish_bases: tuple[str, ...],
        load_preparations: tuple[str, ...],
        load_step_actions: tuple[str, ...],
        curated_recipes,
    ) -> int:
        if recipes_requested == 0 and shopping_lists_requested == 0:
            return 0

        all_seed_users = [*load_authors, *demo_users]
        tag_pool = sorted({tag for spec in curated_recipes for tag in spec.tags})
        ingredient_pool = sorted(
            {ingredient for spec in curated_recipes for ingredient in spec.ingredients}
        )
        ingredient_names = [name for name, _, _ in ingredient_pool]
        ingredient_units = {name: unit for name, _, unit in ingredient_pool}

        created_total = 0
        ingredient_pool_for_lists: list[RecipeIngredient] = []

        for indexes in batched(range(1, recipes_requested + 1), recipe_chunk_size):
            plans = [
                build_synthetic_plan(
                    index,
                    load_authors,
                    rng,
                    tag_pool,
                    ingredient_names,
                    load_dish_bases,
                    load_preparations,
                )
                for index in indexes
            ]
            created_recipes = Recipe.objects.bulk_create(
                [build_synthetic_recipe(plan) for plan in plans],
                batch_size=insert_batch_size,
            )

            ingredient_rows: list[RecipeIngredient] = []
            tag_rows: list[RecipeTag] = []
            photo_rows: list[RecipePhoto] = []
            step_rows: list[RecipeStep] = []
            review_rows: list[RecipeReview] = []
            comment_rows: list[RecipeComment] = []
            step_links: dict[tuple[str, int, str], Recipe] = {}
            ingredient_map: dict[tuple[str, str], RecipeIngredient] = {}

            for recipe_index, (recipe, plan) in enumerate(
                zip(created_recipes, plans, strict=False)
            ):
                for order, ingredient_name in enumerate(plan.ingredient_names):
                    ingredient = RecipeIngredient(
                        recipe=recipe,
                        name=ingredient_name,
                        quantity=_quantity_for_unit(ingredient_units[ingredient_name], rng),
                        unit=ingredient_units[ingredient_name],
                        _order=order,
                    )
                    ingredient_rows.append(ingredient)
                    ingredient_map[(recipe.name, ingredient_name)] = ingredient

                tag_rows.extend(
                    RecipeTag(
                        recipe=recipe,
                        name=tag_name,
                        _order=order,
                    )
                    for order, tag_name in enumerate(plan.tag_names)
                )
                photo_rows.append(
                    RecipePhoto(
                        recipe=recipe,
                        image=placeholder_photo(recipe_index),
                        description=f"Load photo for {plan.name}",
                        _order=0,
                    )
                )
                step_rows.extend(
                    RecipeStep(
                        recipe=recipe,
                        description=(
                            f"{load_step_actions[step_order % len(load_step_actions)]} step "
                            f"{step_order + 1} for {plan.name}."
                        ),
                        _order=step_order,
                    )
                    for step_order in range(plan.step_count)
                )
                for step_order in range(plan.step_count):
                    link_count = min(rng.randint(2, 5), len(plan.ingredient_names))
                    for ingredient_name in rng.sample(list(plan.ingredient_names), k=link_count):
                        step_links[(recipe.name, step_order, ingredient_name)] = recipe

                available_reviewers = [
                    user for user in all_seed_users if user.pk != recipe.author_id
                ]
                if available_reviewers:
                    review_count = min(rng.randint(1, 3), len(available_reviewers))
                    for reviewer in rng.sample(available_reviewers, k=review_count):
                        review_rows.append(
                            RecipeReview(
                                recipe=recipe,
                                user=reviewer,
                                rating=rng.randint(3, 5),
                            )
                        )

                comment_count = rng.randint(1, 2)
                for comment_idx in range(comment_count):
                    commenter = (
                        available_reviewers[
                            (comment_idx + len(recipe.name)) % len(available_reviewers)
                        ]
                        if available_reviewers
                        else recipe.author
                    )
                    comment_rows.append(
                        RecipeComment(
                            recipe=recipe,
                            user=commenter,
                            content=f"Load comment {comment_idx + 1} for {plan.name}.",
                        )
                    )

            created_ingredients = RecipeIngredient.objects.bulk_create(
                ingredient_rows,
                batch_size=insert_batch_size,
            )
            ingredient_pool_for_lists.extend(created_ingredients)
            RecipeTag.objects.bulk_create(tag_rows, batch_size=insert_batch_size)
            RecipePhoto.objects.bulk_create(photo_rows, batch_size=insert_batch_size)
            RecipeStep.objects.bulk_create(step_rows, batch_size=insert_batch_size)

            steps_by_key = {(step.recipe.name, step._order): step for step in step_rows}
            step_ingredient_rows = [
                RecipeStepIngredient(
                    recipe=recipe,
                    step=steps_by_key[(recipe_name, step_order)],
                    ingredient=ingredient_map[(recipe_name, ingredient_name)],
                )
                for (recipe_name, step_order, ingredient_name), recipe in step_links.items()
            ]
            RecipeStepIngredient.objects.bulk_create(
                step_ingredient_rows,
                batch_size=insert_batch_size,
            )
            RecipeReview.objects.bulk_create(review_rows, batch_size=insert_batch_size)
            RecipeComment.objects.bulk_create(comment_rows, batch_size=insert_batch_size)

            created_total += len(created_recipes)

        if recipes_requested and load_authors:
            # A few real copies so the "copied from" banner is discoverable in the
            # load data too. Constant count on purpose: clone() saves row by row.
            originals = list(
                Recipe.objects.filter(author__in=demo_users, original_recipe__isnull=True)
                .order_by("pk")
                .select_related("author")
            )
            cloners = rng.sample(load_authors, k=min(len(originals), len(load_authors)))
            for cloner, original in zip(cloners, originals, strict=False):
                original.clone(cloner)
                created_total += 1

        if shopping_lists_requested:
            generated_lists = [
                build_shopping_list(
                    rng.choice(all_seed_users),
                    f"Load Grocery Plan {index:04d}",
                )
                for index in range(1, shopping_lists_requested + 1)
            ]
            created_lists = ShoppingList.objects.bulk_create(
                generated_lists,
                batch_size=insert_batch_size,
            )
            shopping_list_ids = [shopping_list.pk for shopping_list in created_lists]

            shopping_item_rows: list[ShoppingListItem] = []
            ingredient_pool_for_lists = ingredient_pool_for_lists or list(
                RecipeIngredient.objects.filter(name__in=ingredient_names).order_by("id")
            )
            for shopping_list in (
                ShoppingList.objects.filter(pk__in=shopping_list_ids)
                .select_related("user")
                .order_by("id")
            ):
                list_rng = Random(f"shopping:{shopping_list.pk}:{shopping_list.user_id}")
                item_count = list_rng.randint(6, 20)
                chosen_ingredients = list_rng.sample(
                    ingredient_pool_for_lists,
                    k=min(item_count, len(ingredient_pool_for_lists)),
                )
                shopping_item_rows.extend(
                    build_shopping_item(shopping_list, ingredient, order, list_rng)
                    for order, ingredient in enumerate(chosen_ingredients)
                )
            ShoppingListItem.objects.bulk_create(
                shopping_item_rows,
                batch_size=insert_batch_size,
            )

        return created_total
