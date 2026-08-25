
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
    return PLACEHOLDER_PHOTOS[index % len(PLACEHOLDER_PHOTOS)]


def copy_placeholder_photos() -> int:
    """
    Copies placeholder photos from the seed_assets
    directory to the MEDIA_ROOT/recipe_photos directory.
    Returns:
        int: The number of photos copied.
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
