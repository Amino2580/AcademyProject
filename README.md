# Milad Tarighat Music Academy

A full-stack web application for managing student registrations, weekly class schedules, and music academy administration.

The project includes a React frontend, a Django REST API, PostgreSQL, OTP authentication, JWT authorization, and separate admin and student panels.

## Features

### Public Website

- Academy introduction pages
- Image and video galleries
- Public registration form
- Weekly class availability
- Selection of an available day and time
- Prevention of duplicate time-slot reservations

### Student Account

- Login using mobile number and OTP
- JWT-based authentication
- Personal weekly class schedule
- Access restricted to the authenticated student
- Secure logout with refresh-token blacklisting

### Admin Panel

- Dashboard statistics
- Registration request management
- Approve or reject registration requests
- Automatic student creation after approval
- Automatic class booking after approval
- Student management
- Weekly schedule management
- Protected admin-only API endpoints

## Main Workflow

1. A visitor submits a registration request.
2. The request appears in the admin panel.
3. The administrator reviews the request.
4. When a scheduled request is approved:

   - A student record is created or reused.
   - A class booking is created.
   - The selected time becomes unavailable.
   - The class appears in the student's personal schedule.

## Technology Stack

### Backend

- Python 3.13
- Django 6
- Django REST Framework
- Simple JWT
- PostgreSQL
- drf-spectacular / Swagger
- django-cors-headers

### Frontend

- React 19
- React Router
- Vite 8
- CSS
- Fetch API

### Development Tools

- Docker
- Docker Compose
- ESLint
- Django Test Framework

## Architecture

```text
React Frontend
      |
      | HTTP / JSON
      v
Django REST API
      |
      v
PostgreSQL
```

Authentication flow:

```text
Mobile Number + OTP
        |
        v
Access Token + Refresh Token
        |
        v
Protected Student/Admin APIs
```

## Project Structure

```text
AcademyProject/
├── academy/          # Django project configuration
├── accounts/         # OTP, JWT and user profiles
├── dashboard/        # Admin dashboard API
├── registrations/    # Registration requests
├── schedules/        # Weekly class bookings
├── students/         # Student management
├── frontend/         # React and Vite application
├── media/            # Uploaded media files
├── Dockerfile
├── docker-compose.yml
├── manage.py
└── requirements.txt
```

The `teachers` and `courses` applications are legacy modules and are currently disabled.

## Environment Variables

Copy the example environment file:

### Windows

```bat
copy .env.example .env
```

### Linux/macOS

```bash
cp .env.example .env
```

Important backend variables:

```env
SECRET_KEY=change-this-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

POSTGRES_DB=piano_tarighat_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change-this-password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
CSRF_TRUSTED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

OTP_EXPIRY_SECONDS=120
OTP_RESEND_COOLDOWN_SECONDS=60
OTP_MAX_ATTEMPTS=5
OTP_DELIVERY_BACKEND=console

KAVENEGAR_API_KEY=
KAVENEGAR_VERIFY_TEMPLATE=
```

Do not commit the real `.env` file or production credentials.

## Backend Setup

Create and activate a virtual environment.

### Windows

```bat
python -m venv env
env\Scripts\activate
```

### Linux/macOS

```bash
python -m venv env
source env/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Make sure PostgreSQL is running and the database settings match the `.env` file.

Apply migrations:

```bash
python manage.py migrate
```

Run the backend:

```bash
python manage.py runserver
```

The API will be available at:

```text
http://127.0.0.1:8000
```

## Frontend Setup

Open another terminal:

```bash
cd frontend
npm ci
```

Optionally create `frontend/.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Run the frontend:

```bash
npm run dev
```

The website will be available at:

```text
http://localhost:5173
```

## Docker Setup

The current Docker Compose configuration runs PostgreSQL and the Django backend.

Create the `.env` file and then run:

```bash
docker compose up --build -d
```

Apply migrations inside the backend container:

```bash
docker compose exec web python manage.py migrate
```

View container logs:

```bash
docker compose logs -f web
```

Stop the containers:

```bash
docker compose down
```

The React frontend is currently run separately with Vite during development.

## Creating an Admin Account

Start the Django shell:

```bash
python manage.py shell
```

Then run:

```python
from django.contrib.auth import get_user_model
from accounts.models import UserProfile

phone = "09123456789"

User = get_user_model()

user, _ = User.objects.get_or_create(
    username=phone,
)

user.is_staff = True
user.is_superuser = True
user.is_active = True
user.set_unusable_password()
user.save()

UserProfile.objects.update_or_create(
    user=user,
    defaults={
        "phone": phone,
    },
)
```

Exit the shell:

```python
exit()
```

The administrator can now request an OTP from:

```text
http://localhost:5173/admin/login
```

When `OTP_DELIVERY_BACKEND=console`, the OTP code is printed in the Django terminal.

## Authentication

The application uses two authentication layers:

- Mobile number and OTP verify the user's identity.
- JWT access and refresh tokens maintain the authenticated session.

Authenticated requests contain:

```http
Authorization: Bearer <access-token>
```

Current token lifetimes:

- Access token: 15 minutes
- Refresh token: 7 days

## Main API Endpoints

### Public APIs

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/registrations/` | Submit a registration request |
| GET | `/api/schedule/availability/` | View weekly availability |
| POST | `/api/auth/otp/request/` | Request an OTP |
| POST | `/api/auth/otp/verify/` | Verify OTP and receive JWT tokens |
| POST | `/api/auth/token/refresh/` | Refresh the access token |

### Authenticated User APIs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/auth/me/` | Get the current user |
| POST | `/api/auth/logout/` | Logout and blacklist refresh token |
| GET | `/api/schedule/mine/` | View the student's classes |

### Admin APIs

| Endpoint | Description |
|---|---|
| `/api/admin/dashboard/` | Dashboard statistics |
| `/api/admin/registrations/` | Registration management |
| `/api/admin/students/` | Student management |
| `/api/admin/schedule/` | Schedule management |

## API Documentation

Swagger UI:

```text
http://127.0.0.1:8000/api/docs/
```

OpenAPI schema:

```text
http://127.0.0.1:8000/api/schema/
```

## Running Tests

Run all backend tests:

```bash
python manage.py test
```

Check the Django configuration:

```bash
python manage.py check
```

Check for missing migrations:

```bash
python manage.py makemigrations --check --dry-run
```

Frontend lint:

```bash
cd frontend
npm run lint
```

Frontend production build:

```bash
npm run build
```

## Production Notes

Before deploying the project:

- Set `DEBUG=False`.
- Use a strong and private `SECRET_KEY`.
- Configure the real domain in `ALLOWED_HOSTS`.
- Configure production CORS and CSRF origins.
- Use HTTPS.
- Use a production WSGI server instead of Django `runserver`.
- Configure persistent PostgreSQL backups.
- Configure static and media file serving.
- Set up the real SMS provider.
- Configure Nginx fallback for React Router routes.

## Current Status

The project MVP includes:

- Public registration
- Weekly availability
- Admin approval workflow
- Automatic schedule reservation
- Student OTP login
- JWT authentication
- Personal student schedule
- Admin dashboard and management pages
- Automated backend tests
- Frontend lint and production build checks