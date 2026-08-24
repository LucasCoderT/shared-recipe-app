from rest_framework import status
from rest_framework.exceptions import APIException


class StaleWrite(APIException):
    """The client's updated_at token doesn't match the current DB value.

    Returned as HTTP 409 so the client knows to re-fetch before retrying.
    """

    status_code = status.HTTP_409_CONFLICT
    default_detail = "The resource was modified after you loaded it."
    default_code = "conflict"


class TooManyRecipeTags(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "A recipe can have a maximum of 5 tags."
    default_code = "too_many_tags"
