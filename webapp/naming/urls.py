from django.urls import path

from . import views

app_name = 'naming'

urlpatterns = [
    path('auth/csrf', views.csrf_view, name='csrf'),
    path('auth/login', views.login_view, name='login'),
    path('auth/signup', views.signup_view, name='signup'),
    path('auth/forgot-password', views.forgot_password_view, name='forgot_password'),
    path('me', views.me_view, name='me'),
    path('me/history', views.history_view, name='history'),
    path('me/change-password', views.change_password_view, name='change_password'),
]
