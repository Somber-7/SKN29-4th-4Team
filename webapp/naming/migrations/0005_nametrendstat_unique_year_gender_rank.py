from django.db import migrations, models


def dedupe_trend_stats(apps, schema_editor):
    """(year, gender, rank) 조합에 유니크 제약을 걸기 전에 기존 중복 행을 정리한다.
    데이터 재적재 스크립트를 여러 번 돌리면 같은 순위 행이 중복 적재될 수 있었는데,
    이 제약이 없어 감지되지 않았다 — 먼저 들어온 행만 남기고 나머지는 지운다."""
    NameTrendStat = apps.get_model("naming", "NameTrendStat")
    seen = set()
    for stat in NameTrendStat.objects.order_by("id"):
        key = (stat.year, stat.gender, stat.rank)
        if key in seen:
            stat.delete()
        else:
            seen.add(key)


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("naming", "0004_unique_email_ci"),
    ]

    operations = [
        migrations.RunPython(dedupe_trend_stats, noop),
        migrations.AddConstraint(
            model_name="nametrendstat",
            constraint=models.UniqueConstraint(fields=["year", "gender", "rank"], name="unique_year_gender_rank"),
        ),
    ]
