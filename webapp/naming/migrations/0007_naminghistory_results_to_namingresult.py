import django.db.models.deletion
from django.db import migrations, models


def backfill_naming_results(apps, schema_editor):
    """NamingHistory.results(통짜 JSON 리스트)를 NamingResult 행으로 풀어낸다.
    SQL로 이름별 집계·검색이 불가능했던 문제를 해결하기 위한 정규화 — hangul/hanja/
    sukgyeok은 실 컬럼으로, 나머지 중첩 구조(ruby·sukgyeokDetail·sources·lastName)는
    detail JSON에 그대로 보존해 원래 응답 형태를 잃지 않는다."""
    NamingHistory = apps.get_model("naming", "NamingHistory")
    NamingResult = apps.get_model("naming", "NamingResult")
    for history in NamingHistory.objects.all():
        for i, item in enumerate(history.results or []):
            if not isinstance(item, dict):
                continue
            NamingResult.objects.create(
                history=history,
                sort_order=i,
                hangul=item.get("hangul", "") or "",
                hanja=item.get("hanja", "") or "",
                sukgyeok=item.get("sukgyeok", "") or "",
                detail={
                    "lastName": item.get("lastName", {}),
                    "ruby": item.get("ruby", []),
                    "sukgyeokDetail": item.get("sukgyeokDetail", []),
                    "sources": item.get("sources", []),
                },
            )


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("naming", "0006_trendarticle_date_to_datefield"),
    ]

    operations = [
        migrations.CreateModel(
            name="NamingResult",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("sort_order", models.PositiveIntegerField(default=0)),
                ("hangul", models.CharField(blank=True, max_length=50)),
                ("hanja", models.CharField(blank=True, max_length=50)),
                ("sukgyeok", models.TextField(blank=True)),
                ("detail", models.JSONField(default=dict)),
                (
                    "history",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="result_set",
                        to="naming.naminghistory",
                    ),
                ),
            ],
            options={
                "ordering": ["history_id", "sort_order"],
            },
        ),
        migrations.AddIndex(
            model_name="namingresult",
            index=models.Index(fields=["hangul"], name="naming_nami_hangul_72be14_idx"),
        ),
        migrations.AddIndex(
            model_name="namingresult",
            index=models.Index(fields=["hanja"], name="naming_nami_hanja_d61103_idx"),
        ),
        migrations.RunPython(backfill_naming_results, noop),
        migrations.RemoveField(
            model_name="naminghistory",
            name="results",
        ),
    ]
