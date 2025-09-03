"""
Django settings for backend project.
"""

from pathlib import Path
from datetime import timedelta
import os # Import os module for path manipulation

from dotenv import load_dotenv  # installed in step 1

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = "django-insecure-a_5x^9_k*1djp@=p)pl*aetjbor$%hg@3@c_&ag4h7sjvmke46"
DEBUG = True
ALLOWED_HOSTS = []

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    'django.contrib.sites',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
    'api',
    'corsheaders',
    'rest_framework',
    'rest_framework.authtoken',
    'resume_processor', # ADD THIS LINE: Your new app
    'django_celery_results', # ADD THIS LINE: For Celery results in DB
    'django_extensions',
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    'corsheaders.middleware.CorsMiddleware',
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    'allauth.account.middleware.AccountMiddleware',
]

ROOT_URLCONF = "backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "backend.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

AUTH_PASSWORD_VALIDATORS = [
    { "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator", },
    { "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", },
    { "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator", },
    { "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator", },
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 25,
}

SIMPLE_JWT={
    'ACCESS_TOKEN_LIFETIME':timedelta(minutes=30),
    'ACCESS_TOKEN_LIFETIME':timedelta(days=3)
}

CORS_ORIGIN_ALLOW_ALL=True
CORS_ORIGIN_CREDENTIALS=True

AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"

# ADD THESE LINES: Media files settings for user uploads
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media') # Files will be stored in a 'media' folder at project root

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

LOGIN_REDIRECT_URL='/callback/'
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_AUTHENTICATION_METHOD = 'email'
ACCOUNT_EMAIL_VERIFICATION = 'none'

SOCIALACCOUNT_LOGIN_ON_GET = True
SOCIALACCOUNT_PROVIDERS={
    'google':{
        'SCOPE':['email','profile'],
        'AUTH_PARAMS':{'access_type':'online'},
        'OAUTH_PKCE_ENABLED':True ,
        'FETCH_USERINFO':True,
    }
}
SOCIALACCOUNT_STORE_TOKENS=True
SITE_ID = 1

# ADD THESE LINES: Celery Configuration
CELERY_BROKER_URL = 'redis://localhost:6379/0' # Redis broker URL
CELERY_RESULT_BACKEND = 'django-db' # Store results in Django database
CELERY_ACCEPT_CONTENT = ['json'] # Accept content in JSON format
CELERY_TASK_SERIALIZER = 'json' # Serialize tasks as JSON
CELERY_RESULT_SERIALIZER = 'json' # Serialize results as JSON
CELERY_TIMEZONE = 'UTC' # Use UTC timezone for Celery tasks
CELERY_TASK_TRACK_STARTED = True # Track task progress
CELERY_TASK_CREATE_MISSING_QUEUES = True # Automatically create queues


GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
GROQ_BASE_URL = os.environ.get("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
GROQ_MODEL_NAME = os.environ.get("GROQ_MODEL_NAME", "llama-3.1-8b-instant")
MIN_TEXT_LENGTH_FOR_LLM = int(os.environ.get("MIN_TEXT_LENGTH_FOR_LLM", "50"))

if GROQ_API_KEY:
    os.environ.setdefault("OPENAI_API_KEY", GROQ_API_KEY)

ENABLE_AV_SCAN = os.getenv("ENABLE_AV_SCAN", "0") == "1"
