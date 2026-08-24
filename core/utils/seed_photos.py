"""Placeholder photo assets used by the seed command.

Seeded photo rows are inserted with bulk_create, which never routes through
ImageField.save(), so those rows only carry a file name. The matching files have
to be copied into MEDIA_ROOT separately or every photo URL 404s.

A handful of placeholders are reused across every recipe. Nothing enforces
uniqueness on RecipePhoto.image, so pointing hundreds of rows at four files
keeps the repository small.
"""

from __future__ import annotations

import shutil
from pathlib import Path

from django.conf import settings

SEED_PHOTO_SOURCE_DIR = Path(__file__).resolve().parents[1] / "seed_assets" / "recipe_photos"

PHOTO_UPLOAD_DIR = "recipe_photos"

PLACEHOLDER_PHOTOS = (
    f"{PHOTO_UPLOAD_DIR}/placeholder_1.jpg",
    f"{PHOTO_UPLOAD_DIR}/placeholder_2.jpg",
    f"{PHOTO_UPLOAD_DIR}/placeholder_3.jpg",
    f"{PHOTO_UPLOAD_DIR}/placeholder_4.jpg",
)


def placeholder_photo(index: int) -> str:
    """Return a placeholder path, cycling through the available files."""
    return PLACEHOLDER_PHOTOS[index % len(PLACEHOLDER_PHOTOS)]


def copy_placeholder_photos() -> int:
    """Copy the placeholder files into MEDIA_ROOT, returning how many were written.

    Files that are already present are left alone, so re-seeding is idempotent.
    """
    destination = Path(settings.MEDIA_ROOT) / PHOTO_UPLOAD_DIR
    destination.mkdir(parents=True, exist_ok=True)

    copied = 0
    for source in sorted(SEED_PHOTO_SOURCE_DIR.glob("*.jpg")):
        target = destination / source.name
        if target.exists():
            continue
        shutil.copy2(source, target)
        copied += 1
    return copied
