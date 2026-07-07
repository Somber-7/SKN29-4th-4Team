from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("naming", "0012_activeusertracking_is_logged_in"),
    ]

    operations = [
        migrations.CreateModel(
            name="UserConsent",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("terms_version", models.CharField(max_length=20)),
                ("privacy_version", models.CharField(max_length=20)),
                ("terms_agreed_at", models.DateTimeField()),
                ("privacy_agreed_at", models.DateTimeField()),
                ("agreed_ip", models.GenericIPAddressField(blank=True, null=True)),
                ("user_agent", models.CharField(blank=True, max_length=1000)),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="consent",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "사용자 약관 동의",
                "verbose_name_plural": "사용자 약관 동의",
            },
        ),
    ]
