from rest_framework.permissions import SAFE_METHODS, BasePermission

from core.auth_groups import ADMIN_GROUP


def is_admin_user(user) -> bool:
    """True for superusers, staff, and members of the Admin group."""
    if not user or not getattr(user, "is_authenticated", False):
        return False
    if user.is_superuser or user.is_staff:
        return True
    return user.groups.filter(name=ADMIN_GROUP).exists()


def resolve_owner(obj):
    if hasattr(obj, "author"):
        return obj.author
    if hasattr(obj, "user"):
        return obj.user
    if hasattr(obj, "recipe"):
        return obj.recipe.author
    if hasattr(obj, "shopping_list"):
        return obj.shopping_list.user
    raise TypeError(f"Cannot resolve an owner for {type(obj).__name__}.")


def get_model_for_view(*, view, obj=None):
    if obj is not None:
        return obj._meta.model
    queryset = getattr(view, "queryset", None)
    if queryset is not None:
        return queryset.model
    return view.get_queryset().model


def get_required_permission(*, request, view, obj=None) -> str | None:
    if request.method in SAFE_METHODS:
        return None

    action = {
        "POST": "add",
        "PUT": "change",
        "PATCH": "change",
        "DELETE": "delete",
    }[request.method]
    model = get_model_for_view(view=view, obj=obj)
    return f"{model._meta.app_label}.{action}_{model._meta.model_name}"


class HasGroupPermissionAndOwnershipOrReadOnly(BasePermission):
    message = "You do not have permission to perform this action."

    def has_permission(self, request, view) -> bool:
        if is_admin_user(request.user):
            return True
        if request.method in SAFE_METHODS:
            return True
        if not request.user or not request.user.is_authenticated:
            return False

        required_permission = get_required_permission(request=request, view=view)
        return required_permission is not None and request.user.has_perm(required_permission)

    def has_object_permission(self, request, view, obj) -> bool:
        if is_admin_user(request.user):
            return True
        if request.method in SAFE_METHODS:
            return True

        required_permission = get_required_permission(request=request, view=view, obj=obj)
        return (
            required_permission is not None
            and request.user.has_perm(required_permission)
            and resolve_owner(obj) == request.user
        )