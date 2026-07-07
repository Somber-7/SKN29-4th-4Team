from collections import Counter
from datetime import timedelta

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.utils import timezone

from naming.models import ContactInquiry, DailyMetric, LoginHistory, NamingHistory


def _source_distribution(histories) -> dict[str, int]:
    counts: Counter[str] = Counter()
    for history in histories:
        for result in history.results or []:
            for source in result.get("sources", []) if isinstance(result, dict) else []:
                label = source.get("type") or source.get("label")
                if label:
                    counts[str(label)] += 1
    return dict(counts)


class Command(BaseCommand):
    help = "최근 N일 운영 지표를 DailyMetric에 멱등 집계한다."

    def add_arguments(self, parser):
        parser.add_argument("--days", type=int, default=3, help="오늘 포함 재집계할 최근 일수")

    def handle(self, *args, **options):
        days = max(options["days"], 1)
        today = timezone.localdate()

        for offset in range(days):
            day = today - timedelta(days=offset)
            start = timezone.make_aware(timezone.datetime.combine(day, timezone.datetime.min.time()))
            end = start + timedelta(days=1)

            naming_qs = NamingHistory.objects.filter(created_at__gte=start, created_at__lt=end)
            metric, _ = DailyMetric.objects.update_or_create(
                date=day,
                defaults={
                    "signups": User.objects.filter(
                        is_staff=False, date_joined__gte=start, date_joined__lt=end
                    ).count(),
                    "logins": LoginHistory.objects.filter(
                        success=True, created_at__gte=start, created_at__lt=end
                    ).count(),
                    "naming_requests": naming_qs.count(),
                    "inquiries": ContactInquiry.objects.filter(
                        created_at__gte=start, created_at__lt=end
                    ).count(),
                    "answered_inquiries": ContactInquiry.objects.filter(
                        answered_at__gte=start, answered_at__lt=end
                    ).count(),
                    "source_distribution": _source_distribution(naming_qs),
                },
            )
            self.stdout.write(self.style.SUCCESS(f"{metric.date} 집계 완료"))
