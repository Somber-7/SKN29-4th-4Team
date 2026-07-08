from django.contrib import admin

from .models import NamingHistory, UserConsent


@admin.register(UserConsent)
class UserConsentAdmin(admin.ModelAdmin):
    list_display = ("user", "terms_version", "privacy_version", "terms_agreed_at")
    search_fields = ("user__username", "user__email")


@admin.register(NamingHistory)
class NamingHistoryAdmin(admin.ModelAdmin):
    list_display = ("user", "query_text", "created_at")
    list_filter = ("created_at",)
    search_fields = ("query_text", "user__username", "user__email")
