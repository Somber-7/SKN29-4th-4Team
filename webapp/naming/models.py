from django.conf import settings
from django.db import models


class UserConsent(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="consent")
    terms_version = models.CharField(max_length=20)
    privacy_version = models.CharField(max_length=20)
    terms_agreed_at = models.DateTimeField()
    privacy_agreed_at = models.DateTimeField()
    agreed_ip = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=1000, blank=True)

    class Meta:
        verbose_name = "사용자 약관 동의"
        verbose_name_plural = "사용자 약관 동의"

    def __str__(self):
        return f"{self.user} consent"


class NamingHistory(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="naming_histories")
    query_text = models.TextField()
    request_payload = models.JSONField(default=dict)
    results = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} - {self.created_at:%Y-%m-%d %H:%M}"
