from django.core.exceptions import ValidationError
from pint import UnitRegistry
from pint.errors import UndefinedUnitError

unit_registry = UnitRegistry()


def normalize_unit(value: str) -> str:
    try:
        return unit_registry.get_name(value)
    except UndefinedUnitError as exc:
        raise ValidationError({"unit": f"Unknown unit: {value}"}) from exc


def validate_unit(value: str) -> None:
    try:
        unit_registry.get_name(value)
    except UndefinedUnitError as exc:
        raise ValidationError(f"Unknown unit: {value}") from exc
