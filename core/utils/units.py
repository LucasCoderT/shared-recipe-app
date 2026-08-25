"""
Ingredient units.

A fixed list of cooking units. The unit field on the frontend is a select over
this same list, so the server only has to check membership; anything else is
rejected rather than guessed at.
"""

from django.core.exceptions import ValidationError

UNITS: tuple[str, ...] = (
    # weight
    "gram",
    "kilogram",
    "milligram",
    "ounce",
    "pound",
    # volume
    "milliliter",
    "liter",
    "teaspoon",
    "tablespoon",
    "fluid ounce",
    "cup",
    "pint",
    "quart",
    "gallon",
    # kitchen measures and countable things
    "pinch",
    "dash",
    "count",
    "clove",
    "slice",
    "can",
    "bunch",
    "package",
)


def normalize_unit(value: str) -> str:
    """Return the unit as it will be stored, or "" for no unit."""
    unit = (value or "").strip()
    if not unit:
        return ""
    if unit not in UNITS:
        raise ValidationError({"unit": f"Unknown unit: {value}"})
    return unit


def validate_unit(value: str) -> None:
    """Model field validator: blank or one of UNITS."""
    unit = (value or "").strip()
    if unit and unit not in UNITS:
        raise ValidationError(f"Unknown unit: {value}")
