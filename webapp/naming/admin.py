from django.contrib import admin

from .models import NamingHistory, UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "status", "approval_status", "terms_agreed_at")
    search_fields = ("user__username", "user__email")
    list_filter = ("status", "approval_status")


@admin.register(NamingHistory)
class NamingHistoryAdmin(admin.ModelAdmin):
    list_display = ("user", "query_text", "created_at")
    list_filter = ("created_at",)
    search_fields = ("query_text", "user__username", "user__email")
