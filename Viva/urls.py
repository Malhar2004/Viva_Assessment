from django.contrib import admin
from django.urls import path, include
from . import views

urlpatterns = [
    path('', views.home, name="home"),
    path('signup_login/', views.signup_login ,name='sign_log'),
    path('viva/', views.Viva_interfcae, name='Viva_inter'),
]
