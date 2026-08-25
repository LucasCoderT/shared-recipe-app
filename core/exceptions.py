from rest_framework import status
from rest_framework.exceptions import APIException


class StaleWrite(APIException):
    """
    Exception raised when a resource is modified after it was loaded, indicating a stale write.
    """

    status_code = status.HTTP_409_CONFLICT
    default_detail = "The resource was modified after you loaded it."
    default_code = "conflict"


class TooManyRecipeTags(APIException):
    """
    Exception raised when a recipe has more than 5 tags.
    """

    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "A recipe can have a maximum of 5 tags."
    default_code = "too_many_tags"


class AlreadyExists(APIException):
    """
    Exception raised when a write collides with a unique constraint that the
    serializer did not (or could not, in a race) catch first.
    """

    status_code = status.HTTP_409_CONFLICT
    default_detail = "That already exists."
    default_code = "already_exists"
