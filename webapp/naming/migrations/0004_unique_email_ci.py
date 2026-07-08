from django.db import migrations


def dedupe_emails(apps, schema_editor):
    """이메일 대소문자 무시 중복 계정을 정리한다. SignupForm.clean_email이
    User.objects.filter(email__iexact=...)로 앱 레벨 체크만 하고 DB에는 유니크
    제약이 없어, 동시 요청이면 같은 이메일로 두 계정이 생길 수 있었다(레이스
    컨디션). 유니크 인덱스를 걸기 전에 먼저 정리해야 CREATE UNIQUE INDEX가
    실패하지 않는다 — 가입일이 빠른 계정을 남기고 나머지는 이메일을 비운다."""
    User = apps.get_model("auth", "User")
    seen = set()
    for user in User.objects.exclude(email="").order_by("date_joined", "id"):
        key = user.email.lower()
        if key in seen:
            user.email = ""
            user.save(update_fields=["email"])
        else:
            seen.add(key)


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("naming", "0003_admin_features_and_userprofile"),
    ]

    operations = [
        migrations.RunPython(dedupe_emails, noop),
        migrations.RunSQL(
            sql="CREATE UNIQUE INDEX auth_user_email_ci_uniq ON auth_user (LOWER(email)) WHERE email <> '';",
            reverse_sql="DROP INDEX IF EXISTS auth_user_email_ci_uniq;",
        ),
    ]
