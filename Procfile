release: python manage.py migrate --noinput && python manage.py collectstatic --noinput
web: gunicorn jesrestudio_backend.wsgi:application --timeout 300
