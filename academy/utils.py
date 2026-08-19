from rest_framework.views import exception_handler
from rest_framework.response import Response

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    
    if response is not None:
        
        return Response(
            {
                "metaData": {
                    "status": {
                        "statusCode": response.status_code,
                        "message": response.data.get("detail") or str(response.data)
                    }
                }
            },
            status=response.status_code
        )
    
    return response