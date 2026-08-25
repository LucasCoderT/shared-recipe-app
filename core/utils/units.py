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
    """Normalizes a unit string to the value that is stored.

    Args:
        value: The unit as entered. Blank or whitespace means no unit.

    Returns:
        The unit with surrounding whitespace removed, or an empty string when
        no unit was given.

    Raises:
        ValidationError: If the unit is not one of UNITS.
    """
    unit = (value or "").strip()
    if not unit:
        return ""
    if unit not in UNITS:
        raise ValidationError({"unit": f"Unknown unit: {value}"})
    return unit


def validate_unit(value: str) -> None:
    """Validates the unit stored on a model field.

    Args:
        value: The unit to check. Blank is allowed and means no unit.

    Raises:
        ValidationError: If the unit is not blank and not one of UNITS.
    """
    unit = (value or "").strip()
    if unit and unit not in UNITS:
        raise ValidationError(f"Unknown unit: {value}")
