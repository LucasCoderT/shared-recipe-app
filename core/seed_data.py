from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class RecipeSpec:
    name: str
    author_username: str
    description: str
    tags: tuple[str, ...]
    ingredients: tuple[tuple[str, str, str], ...]
    steps: tuple[tuple[str, tuple[str, ...]], ...]
    reviews: tuple[tuple[str, int], ...]
    comments: tuple[tuple[str, str], ...]


@dataclass(frozen=True)
class SeedPayload:
    users: tuple[dict[str, str], ...]
    curated_recipes: tuple[RecipeSpec, ...]
    load_dish_bases: tuple[str, ...]
    load_preparations: tuple[str, ...]
    load_step_actions: tuple[str, ...]


def default_seed_payload_path() -> Path:
    return Path(__file__).resolve().parent / "tests" / "seed_data" / "seed_data.json"


def load_seed_payload(path: Path | None = None) -> SeedPayload:
    raw = json.loads((path or default_seed_payload_path()).read_text())
    return SeedPayload(
        users=tuple(raw["users"]),
        curated_recipes=tuple(
            RecipeSpec(
                name=recipe["name"],
                author_username=recipe["author_username"],
                description=recipe["description"],
                tags=tuple(recipe["tags"]),
                ingredients=tuple(
                    (ingredient["name"], ingredient["quantity"], ingredient["unit"])
                    for ingredient in recipe["ingredients"]
                ),
                steps=tuple(
                    (step["description"], tuple(step["ingredients"]))
                    for step in recipe["steps"]
                ),
                reviews=tuple(
                    (review["username"], review["rating"]) for review in recipe["reviews"]
                ),
                comments=tuple(
                    (comment["username"], comment["content"]) for comment in recipe["comments"]
                ),
            )
            for recipe in raw["curated_recipes"]
        ),
        load_dish_bases=tuple(raw["load_templates"]["dish_bases"]),
        load_preparations=tuple(raw["load_templates"]["preparations"]),
        load_step_actions=tuple(raw["load_templates"]["step_actions"]),
    )
