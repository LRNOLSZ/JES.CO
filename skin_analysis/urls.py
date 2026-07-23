from django.urls import path
from .views import submit_analysis, price

urlpatterns = [
    path('submit/', submit_analysis, name='skin-analysis-submit'),
    path('price/',  price,           name='skin-analysis-price'),
]
