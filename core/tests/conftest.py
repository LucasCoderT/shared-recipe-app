from __future__ import annotations

import pytest
from django.core.management import call_command

from core.seed_data import load_seed_payload


@pytest.fixture
def seed_data_payload():
    return load_seed_payload()


@pytest.fixture
def seed_data_factory(db):
    def _seed(**kwargs):
        call_command("seed_data", **kwargs)

    return _seed
