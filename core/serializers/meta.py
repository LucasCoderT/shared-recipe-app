from django.contrib.auth.models import AnonymousUser
from rest_framework import serializers


class HealthSerializer(serializers.Serializer):
    status = serializers.CharField()


class WhoAmISerializer(serializers.Serializer):
    authenticated = serializers.BooleanField()
    id = serializers.IntegerField(required=False)
    email = serializers.EmailField(required=False)
    display_name = serializers.CharField(required=False, allow_blank=True)
    is_staff = serializers.BooleanField(required=False)
    groups = serializers.ListField(child=serializers.CharField(), required=False)

    @classmethod
    def from_user(cls, user: "AnonymousUser"):
        return cls(
            {
                "authenticated": True,
                "id": user.pk,
                "email": user.email,
                "display_name": user.display_name,
                "is_staff": user.is_staff,
                "groups": list(user.groups.values_list("name", flat=True)),
            }
        )
