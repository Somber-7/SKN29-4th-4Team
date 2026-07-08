import datetime

from django.db import migrations, models


def backfill_date_field(apps, schema_editor):
    """기존 CharField(예: "2026.07.03")를 파싱해 새 DateField 컬럼에 채운다.
    파싱 실패(형식이 다른 레거시 값 등)는 created_at 날짜로 대체해 NOT NULL
    제약을 위반하지 않게 한다."""
    TrendArticle = apps.get_model("naming", "TrendArticle")
    for article in TrendArticle.objects.all():
        try:
            parsed = datetime.datetime.strptime(article.date, "%Y.%m.%d").date()
        except (ValueError, TypeError):
            parsed = article.created_at.date() if article.created_at else datetime.date.today()
        article.date_new = parsed
        article.save(update_fields=["date_new"])


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("naming", "0005_nametrendstat_unique_year_gender_rank"),
    ]

    operations = [
        migrations.AddField(
            model_name="trendarticle",
            name="date_new",
            field=models.DateField(null=True),
        ),
        migrations.RunPython(backfill_date_field, noop),
        migrations.RemoveField(model_name="trendarticle", name="date"),
        migrations.RenameField(model_name="trendarticle", old_name="date_new", new_name="date"),
        migrations.AlterField(
            model_name="trendarticle",
            name="date",
            field=models.DateField(),
        ),
    ]
