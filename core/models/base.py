from typing import TYPE_CHECKING

from django.db import models


class TimestampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class OrderableModelMixin:
    if TYPE_CHECKING:
        pk: int | None
        _order: int

    @property
    def position(self) -> int | None:
        if self.pk is None:
            return None
        return getattr(self, "_order", 0) + 1
