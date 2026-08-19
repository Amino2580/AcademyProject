import requests


USER_SERVICE_URL = "http://localhost:8081/api/v1/user"


def get_user_by_national_id(national_id):
    try:
        response = requests.get(
            f"{USER_SERVICE_URL}/users/{national_id}",
            timeout=5
        )

    except requests.RequestException:
        return {
            "user": None,
            "metaData": {
                "status": {
                    "statusCode": 503,
                    "message": "User Service is unavailable"
                }
            }
        }

    try:
        data = response.json()
    except ValueError:
        return {
            "user": None,
            "metaData": {
                "status": {
                    "statusCode": 502,
                    "message": "Invalid response from User Service"
                }
            }
        }

    status = data.get("metaData", {}).get("status", {})
    status_code = status.get("statusCode")

    if status_code == 404:
        return {
            "user": None,
            "metaData": {
                "status": {
                    "statusCode": 404,
                    "message": "User not found"
                }
            }
        }

    return data