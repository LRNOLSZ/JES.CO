from pathlib import Path
from decouple import config, Csv
from django.templatetags.static import static
from django.urls import reverse_lazy

BASE_DIR = Path(__file__).resolve().parent.parent

# --- Security ---
SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='127.0.0.1,localhost', cast=Csv())

# --- Application Definition ---
INSTALLED_APPS = [
    # Unfold must come BEFORE django.contrib.admin
    'unfold',
    'unfold.contrib.filters',
    'unfold.contrib.forms',

    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',

    # Local apps
    'accounts',
    'gallery',
    'core',
    'products',
    'courses',
    'imagekit',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # Must be before CommonMiddleware
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'accounts.middleware.MediaAccessMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'jesrestudio_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'jesrestudio_backend.wsgi.application'

# --- Database (PostgreSQL via .env) ---
DATABASES = {
    'default': {
        'ENGINE': config('DB_ENGINE', default='django.db.backends.postgresql'),
        'NAME': config('DB_NAME'),
        'USER': config('DB_USER'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='5432'),
    }
}

# --- Custom User Model ---
AUTH_USER_MODEL = 'accounts.User'

# --- Password Validation ---
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# --- Internationalisation ---
LANGUAGE_CODE = config('LANGUAGE_CODE', default='en-us')
TIME_ZONE = config('TIME_ZONE', default='UTC')
USE_I18N = True
USE_TZ = True

# --- Static & Media Files ---
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static']
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# --- Default Primary Key ---
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# --- CORS (React/Vite dev server) ---
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]

# --- Django REST Framework ---
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

# --- Django Imagekit ---
IMAGEKIT_CACHEFILE_DIR = 'CACHE/images'
IMAGEKIT_DEFAULT_CACHEFILE_STRATEGY = 'imagekit.cachefiles.strategies.Optimistic'

# --- Django Unfold Admin Theme (Royal Purple #60269E) ---
UNFOLD = {
    "SITE_TITLE": "JES.CO",
    "SITE_HEADER": "JES.CO Admin",
    "SITE_SUBHEADER": "Brand Management Portal",
    "SITE_URL": "/",
    "SHOW_HISTORY": True,
    "SHOW_VIEW_ON_SITE": True,
    "STYLES": [
        lambda request: static("css/admin_custom.css"),
    ],
    "COLORS": {
        "primary": {
            "50":  "245 240 255",
            "100": "233 221 255",
            "200": "214 187 255",
            "300": "186 143 255",
            "400": "157  95 255",
            "500": "129  53 240",
            "600":  "96  38 158",
            "700":  "78  30 128",
            "800":  "62  22 101",
            "900":  "48  16  79",
            "950":  "30   8  52",
        },
    },
    "NAVIGATION": [
        {
            "title": "General Settings",
            "separator": True,
            "collapsible": False,
            "items": [
                {
                    "title": "Site Settings",
                    "icon": "settings",
                    "link": reverse_lazy("admin:core_sitesettings_changelist"),
                },
                {
                    "title": "Social Links",
                    "icon": "share",
                    "link": reverse_lazy("admin:core_sociallink_changelist"),
                },
                {
                    "title": "Intro Videos",
                    "icon": "videocam",
                    "link": reverse_lazy("admin:core_introvideo_changelist"),
                },
            ],
        },
        {
            "title": "Jesres Glam Studio",
            "separator": True,
            "collapsible": False,
            "items": [
                {
                    "title": "Gallery",
                    "icon": "photo_library",
                    "link": reverse_lazy("admin:gallery_galleryitem_changelist"),
                },
                {
                    "title": "Testimonials",
                    "icon": "star",
                    "link": reverse_lazy("admin:core_testimonial_changelist"),
                },
            ],
        },
        {
            "title": "Makeup Sets",
            "separator": True,
            "collapsible": False,
            "items": [
                {
                    "title": "All Makeup Items",
                    "icon": "brush",
                    "link": "/admin/products/productitem/?category=makeup",
                },
            ],
        },
        {
            "title": "Skincare Sets",
            "separator": True,
            "collapsible": False,
            "items": [
                {
                    "title": "All Skincare Items",
                    "icon": "spa",
                    "link": "/admin/products/productitem/?category=skincare",
                },
            ],
        },
        {
            "title": "Curated Collections",
            "separator": True,
            "collapsible": False,
            "items": [
                {
                    "title": "All Collection Items",
                    "icon": "collections_bookmark",
                    "link": "/admin/products/productitem/?category=collections",
                },
            ],
        },
        {
            "title": "Users",
            "separator": True,
            "collapsible": False,
            "items": [
                {
                    "title": "All Users",
                    "icon": "group",
                    "link": reverse_lazy("admin:accounts_user_changelist"),
                },
            ],
        },
    ],
}
