from pathlib import Path
from decouple import config, Csv
from django.templatetags.static import static
from django.urls import reverse_lazy
from corsheaders.defaults import default_headers

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
    'axes',
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
    'bookings',
    'imagekit',

    # Import/Export
    'import_export',

    # Cloud storage
    'storages',
    'cloudinary_storage',
    'cloudinary',

    # Must be last — hooks every other app's FileField/ImageField for cleanup
    'django_cleanup.apps.CleanupConfig',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # must be directly after SecurityMiddleware
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # Must be before CommonMiddleware
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'axes.middleware.AxesMiddleware',  # must be after AuthenticationMiddleware
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# --- django-axes (admin login brute-force protection) ---
AUTHENTICATION_BACKENDS = [
    'axes.backends.AxesStandaloneBackend',  # must be first
    'django.contrib.auth.backends.ModelBackend',
]
AXES_FAILURE_LIMIT = 10          # lock after 10 failed attempts
AXES_COOLOFF_TIME = 1            # auto-unlock after 1 hour
AXES_RESET_ON_SUCCESS = True     # reset counter on successful login
AXES_LOCKOUT_PARAMETERS = ['ip_address']

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

# --- Database ---
# Railway provides a single DATABASE_URL for its managed Postgres; local dev keeps
# using the discrete DB_* vars below, so nothing changes day-to-day.
import dj_database_url  # noqa: E402

DATABASE_URL = config('DATABASE_URL', default='')
if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.parse(DATABASE_URL, conn_max_age=600)
    }
else:
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

# --- Referrer-Policy ---
# Django's SecurityMiddleware defaults to 'same-origin', which strips the Referer
# header entirely on cross-origin requests. hls.js's admin video previews fetch
# from Bunny Stream's CDN (a different origin), and Bunny's pull zone rejects any
# request with no Referer present — so the implicit default breaks admin video
# playback. 'strict-origin-when-cross-origin' is the browser's own common default:
# it still sends the origin (not the full path/query) cross-origin, which is enough.
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'

# HTTPS hardening — no-ops locally (DEBUG=True), active once deployed with DEBUG=False.
# Railway terminates SSL at its edge and forwards plain HTTP internally, so redirecting
# to HTTPS and marking cookies secure-only is safe and standard here.
# SECURE_PROXY_SSL_HEADER tells Django to trust Railway's X-Forwarded-Proto header when
# deciding if a request is secure — without it, Django can't tell the original request
# was HTTPS (it only sees the internal plain-HTTP hop) and redirects every request to
# HTTPS forever, causing ERR_TOO_MANY_REDIRECTS.
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT   = not DEBUG
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE    = not DEBUG

# --- Admin session timeout ---
# Auto-logs the admin out after 15 minutes of inactivity — protects Maame Ama if she
# forgets to sign out on a borrowed/shared device. SESSION_SAVE_EVERY_REQUEST resets the
# countdown on every request, so this is 15 minutes of inactivity, not a fixed 15-minute
# session regardless of activity. This is the only place Django's built-in session cookie
# is used in this project (students authenticate via magic-link + CourseSession instead).
SESSION_COOKIE_AGE = 900  # 15 minutes, in seconds
SESSION_SAVE_EVERY_REQUEST = True

# --- CORS ---
# Comma-separated env var, same pattern as ALLOWED_HOSTS — defaults to the Vite dev
# server so local dev is unaffected. Set a real CORS_ALLOWED_ORIGINS env var on
# Railway once the Vercel domain exists.
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:5173,http://127.0.0.1:5173',
    cast=Csv(),
)

# Course dashboard/session endpoints authenticate via a custom X-Course-Session
# header instead of cookies — corsheaders' default allow-list doesn't include it,
# so the browser's preflight was rejecting every request carrying it.
CORS_ALLOW_HEADERS = list(default_headers) + ['x-course-session']

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

# --- Email (Brevo, via HTTP API not SMTP — Railway blocks outbound SMTP by default,
# confirmed via a real TimeoutError connecting to smtp-relay.brevo.com:587 in prod.
# See jesrestudio_backend/email_backends.py) ---
EMAIL_BACKEND      = 'jesrestudio_backend.email_backends.BrevoAPIBackend'
# SMTP settings below are no longer read by the active backend — kept only as a
# documented rollback path if ever needed.
EMAIL_HOST         = config('EMAIL_HOST', default='smtp-relay.brevo.com')
EMAIL_PORT         = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS      = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_USE_SSL      = config('EMAIL_USE_SSL', default=False, cast=bool)
EMAIL_HOST_USER    = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = '"JES.CO" <jescomanagement@gmail.com>'

# --- Notifications ---
MAAME_AMA_EMAIL = config('MAAME_AMA_EMAIL', default='')
WHATSAPP_NUMBER = config('WHATSAPP_NUMBER', default='')  # international format, no +

# --- Paystack ---
# Empty by default — courses/views.py's paystack_webhook stays gated (503) until
# a real key is set. Public key is frontend-only (frontend/.env, VITE_PAYSTACK_PUBLIC_KEY).
PAYSTACK_SECRET_KEY = config('PAYSTACK_SECRET_KEY', default='')

# --- Magic Link ---
MAGIC_LINK_EXPIRY_MINUTES = 15
FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:5173')

# --- Cache (rate limiting) ---
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}

# --- Cloudinary (video storage) ---
CLOUDINARY_STORAGE = {
    'CLOUD_NAME': config('CLOUDINARY_CLOUD_NAME', default=''),
    'API_KEY':    config('CLOUDINARY_API_KEY',    default=''),
    'API_SECRET': config('CLOUDINARY_API_SECRET', default=''),
}

# --- Cloudflare R2 Storage (media) + Whitenoise (static) ---
# When the four R2 vars are set in .env, all uploaded images go to R2; otherwise
# files save locally to /media/ (dev mode) — same as Django's own default.
# staticfiles always goes through whitenoise's compressed/manifest storage so
# `collectstatic` output is served correctly in production regardless of R2.
from .storage_backends import R2_CONFIGURED  # noqa: E402

STORAGES = {
    'default': {
        'BACKEND': 'jesrestudio_backend.storage_backends.R2MediaStorage'
                   if R2_CONFIGURED else
                   'django.core.files.storage.FileSystemStorage',
    },
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    },
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
        lambda request: static("css/admin_file_dropzone.css"),
    ],
    "SCRIPTS": [
        lambda request: static("js/admin_file_dropzone.js"),
        lambda request: static("js/video_upload_progress.js"),
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
            "title": "Courses",
            "separator": True,
            "collapsible": False,
            "items": [
                {
                    "title": "All Courses",
                    "icon": "play_circle",
                    "link": reverse_lazy("admin:courses_course_changelist"),
                },
                {
                    "title": "Course Tiers",
                    "icon": "layers",
                    "link": reverse_lazy("admin:courses_coursetier_changelist"),
                },
                {
                    "title": "Purchases",
                    "icon": "receipt_long",
                    "link": reverse_lazy("admin:courses_coursepurchase_changelist"),
                },
                {
                    "title": "Students",
                    "icon": "school",
                    "link": reverse_lazy("admin:courses_student_changelist"),
                },
                {
                    "title": "Active Sessions",
                    "icon": "devices",
                    "link": reverse_lazy("admin:courses_coursesession_changelist"),
                },
            ],
        },
        {
            "title": "Orders",
            "separator": True,
            "collapsible": False,
            "items": [
                {
                    "title": "All Orders",
                    "icon": "shopping_bag",
                    "link": reverse_lazy("admin:products_order_changelist"),
                },
                {
                    "title": "Delivery Zones",
                    "icon": "local_shipping",
                    "link": reverse_lazy("admin:products_deliveryzone_changelist"),
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

# --- Logging ---
# Django's built-in default only prints errors to console when DEBUG=True (it tries to
# email admins instead when DEBUG=False). Railway/most hosts capture stdout as the log
# stream, so without this, 500 errors happen silently with nothing to see in the logs.
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'WARNING',
    },
    'loggers': {
        'django.request': {
            'handlers': ['console'],
            'level': 'ERROR',
            'propagate': False,
        },
    },
}
