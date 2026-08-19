from rest_framework.views import exception_handler
from rest_framework.response import Response
from django.core.exceptions import ObjectDoesNotExist
from rest_framework.exceptions import ValidationError, NotFound, PermissionDenied, AuthenticationFailed, NotAuthenticated, MethodNotAllowed, NotAcceptable, UnsupportedMediaType, Throttled

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        status_code = response.status_code
        message = ""

        if isinstance(response.data, dict):
            if "detail" in response.data:
                message = response.data["detail"]
            elif "non_field_errors" in response.data:
                message = response.data["non_field_errors"][0]
            else:
                first_field = list(response.data.keys())[0]
                message = f"{first_field}: {response.data[first_field][0]}"
        elif isinstance(response.data, list):
            message = response.data[0] if response.data else "Validation error"
        else:
            message = str(response.data)

        return Response(
            {
                "metaData": {
                    "status": {
                        "statusCode": status_code,
                        "message": message
                    }
                }
            },
            status=status_code
        )

    return response