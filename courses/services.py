import requests
from requests.exceptions import RequestException, Timeout

USER_SERVICE_URL = "http://localhost:8081/api/v1/user"


def get_user_by_national_id(national_id):
    try:
        response = requests.get(
            f"{USER_SERVICE_URL}/users/{national_id}",
            timeout=5
        )
        response.raise_for_status()  # اگه status 4xx یا 5xx باشه خطا می‌ده

    except Timeout:
        return {
            "user": None,
            "metaData": {
                "status": {
                    "statusCode": 504,
                    "message": "User Service timeout"
                }
            }
        }
    except RequestException as e:
        # اینجا هم ۴۰۴ و هم ۵۰۳ و هر خطای دیگه‌ای رو می‌گیره
        status_code = 503
        message = "User Service is unavailable"
        
        # اگه خطا ۴۰۴ باشه، پیام رو تغییر بده
        if hasattr(e, 'response') and e.response is not None:
            if e.response.status_code == 404:
                status_code = 404
                message = "User not found"
            elif 400 <= e.response.status_code < 500:
                status_code = e.response.status_code
                message = f"User Service error: {e.response.status_code}"
        
        return {
            "user": None,
            "metaData": {
                "status": {
                    "statusCode": status_code,
                    "message": message
                }
            }
        }

    # pars کردن JSON
    try:
        data = response.json()
    except ValueError:
        return {
            "user": None,
            "metaData": {
                "status": {
                    "statusCode": 502,
                    "message": "Invalid response from User Service (not JSON)"
                }
            }
        }

    # ساختار پاسخ رو یکدست کن
    # اگه سرویس جاوا ساختار metaData داره، ازش استفاده کن
    status = data.get("metaData", {}).get("status", {})
    status_code = status.get("statusCode")

    # اگه status_code وجود نداشت یا ۲۰۰ نبود، خطا برگردون
    if not status_code or status_code != 200:
        return {
            "user": None,
            "metaData": {
                "status": {
                    "statusCode": status_code or 502,
                    "message": status.get("message") or "Unknown error from User Service"
                }
            }
        }

    # همه چی اوکی - برگردون با ساختار یکدست
    return {
        "user": data.get("user"),  # اگه سرویس جاوا user رو توی data برگردونه
        "metaData": {
            "status": {
                "statusCode": 200,
                "message": "User found"
            }
        }
    }