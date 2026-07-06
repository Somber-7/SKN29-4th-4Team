from django.contrib import admin

from .models import NamingHistory


@admin.register(NamingHistory)
class NamingHistoryAdmin(admin.ModelAdmin):
    list_display = ("user", "query_text", "created_at")
    list_filter = ("created_at",)
    search_fields = ("query_text", "user__username", "user__email")
