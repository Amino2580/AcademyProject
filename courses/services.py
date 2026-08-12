import requests


USER_SERVICE_URL = "http://localhost:8081/api/v1/user"


def get_user_by_national_id(national_id):
    response = requests.get(
        f"{USER_SERVICE_URL}/users/{national_id}"
    )

    return response.json()