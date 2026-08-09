from django.apps import AppConfig


class CoursesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'courses'

    def ready(self):
        import jesrestudio_backend.bunny_storage  # noqa: F401 — registers the Bunny signing system check
