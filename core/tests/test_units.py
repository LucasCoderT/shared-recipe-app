import pytest
from django.core.exceptions import ValidationError

from core.utils.units import UNITS, normalize_unit, validate_unit


def test_blank_unit_is_allowed():
    assert normalize_unit("") == ""
    assert normalize_unit("   ") == ""
    validate_unit("")


def test_every_listed_unit_is_accepted():
    for unit in UNITS:
        assert normalize_unit(unit) == unit
        validate_unit(unit)


def test_surrounding_whitespace_is_stripped():
    assert normalize_unit("  cup  ") == "cup"


def test_unknown_units_are_rejected():
    # The field is a select over UNITS, so anything else is a client bug or a
    # hand-crafted request; there is no alias handling to be lenient with.
    for bad in ("zzz", "picoinch", "tbsp", "Gram"):
        with pytest.raises(ValidationError):
            normalize_unit(bad)
        with pytest.raises(ValidationError):
            validate_unit(bad)
