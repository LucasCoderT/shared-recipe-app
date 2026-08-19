from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from core.models import base


class RecipieTag(models.Model):
    name = models.CharField(max_length=50)

    def __str__(self):
        return self.name


class RecipieStep(base.TimestampedModel):
    recipie_item = models.ForeignKey('RecipieIngredient', on_delete=models.CASCADE, related_name='steps')
    step_number = models.PositiveIntegerField()
    description = models.TextField()

    class Meta:
        unique_together = ('recipie_item', 'step_number')
        ordering = ['step_number']

    def __str__(self):
        return f"Step {self.step_number} for {self.recipie_item.name}"


class RecipieIngredient(base.TimestampedModel):
    name = models.CharField(max_length=255)
    quantity = models.CharField(max_length=100)
    unit = models.CharField(max_length=50)

class RecipiePhoto(base.TimestampedModel):
    recipie = models.ForeignKey('Recipie', on_delete=models.CASCADE, related_name='photos')
    image = models.ImageField(upload_to='recipie_photos/')
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Photo for {self.recipie.name}"

class Recipie(base.TimestampedModel):
    name = models.CharField(max_length=255)
    description = models.TextField()
    ingredients = models.ManyToManyField(RecipieIngredient, related_name='recipies')
    steps = models.ManyToManyField(RecipieStep, related_name='recipies')
    tags = models.ManyToManyField(RecipieTag, related_name='recipies')
    rating = models.IntegerField(blank=True, null=True,
                               validators=[MinValueValidator(0), MaxValueValidator(5)])

    def __str__(self):
        return self.name
