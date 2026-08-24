from django.core.exceptions import ValidationError
from pint import UnitRegistry
from pint.errors import UndefinedUnitError

unit_registry = UnitRegistry()


def normalize_unit(value: str) -> str:
    # A blank unit is meaningful: countable ingredients ("3 eggs") have no unit
    # to convert, so there is nothing for pint to resolve.
    if not value:
        return ""
    try:
        return unit_registry.get_name(value)
    except UndefinedUnitError as exc:
        raise ValidationError({"unit": f"Unknown unit: {value}"}) from exc


def validate_unit(value: str) -> None:
    if not value:
        return
    try:
        unit_registry.get_name(value)
    except UndefinedUnitError as exc:
        raise ValidationError(f"Unknown unit: {value}") from exc
