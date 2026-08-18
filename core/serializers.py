from django.contrib.auth.base_user import AbstractBaseUser
from django.contrib.auth.models import AnonymousUser
from rest_framework import serializers


class HealthSerializer(serializers.Serializer):
    status = serializers.CharField()


class WhoAmISerializer(serializers.Serializer):
    authenticated = serializers.BooleanField()
    id = serializers.IntegerField(required=False)
    username = serializers.CharField(required=False)
    is_staff = serializers.BooleanField(required=False)
    groups = serializers.ListField(child=serializers.CharField(), required=False)

    @classmethod
    def from_user(cls, user: AbstractBaseUser | AnonymousUser):
        return cls(
            {
                "authenticated": True,
                "id": user.pk,
                "username": user.get_username(),
                "is_staff": user.is_staff,
                "groups": list(user.groups.values_list("name", flat=True)),
            }
        )
