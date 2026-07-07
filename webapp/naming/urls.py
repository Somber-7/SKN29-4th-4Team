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
    path('me/inquiries', views.inquiries_view, name='inquiries'),
    path('me/change-password', views.change_password_view, name='change_password'),
    path('support/contact', views.contact_submit_view, name='contact_submit'),
    path('support/notices', views.notice_list_view, name='notice_list'),
    path('support/notices/<int:notice_id>', views.notice_detail_view, name='notice_detail'),
    path('support/faqs', views.faq_list_view, name='faq_list'),
    path('support/heartbeat', views.heartbeat_view, name='heartbeat'),
]
