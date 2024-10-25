from django.contrib import admin
from django.urls import path, include
from . import views

urlpatterns = [
    path('', views.home, name="home"),
    path('signup_login/', views.signup_login ,name='sign_log'),
    path('viva/', views.Viva_interface, name='Viva_inter'),
    path('rag/', views.rag, name="rag_model"),
    path('upload/', views.upload_file, name='upload_file'),
    path('process_qa/', views.process_qa, name='process_qa'),
    path('rag/compare/', views.rag_compare, name='rag_compare'),
]
