from django.urls import path

from . import views

app_name = 'naming'

urlpatterns = [
    path('auth/csrf', views.csrf_view, name='csrf'),
    path('auth/login', views.login_view, name='login'),
    path('auth/logout', views.logout_view, name='logout'),
    path('auth/signup', views.signup_view, name='signup'),
    path('auth/check-email', views.check_email_view, name='check_email'),
    path('auth/verify-password-reset-account', views.verify_password_reset_account_view, name='verify_password_reset_account'),
    path('auth/forgot-password', views.forgot_password_view, name='forgot_password'),
    path('me', views.me_view, name='me'),
    path('me/history', views.history_view, name='history'),
    path('me/change-password', views.change_password_view, name='change_password'),
]
