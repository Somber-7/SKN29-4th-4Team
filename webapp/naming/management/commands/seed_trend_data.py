import os
import json
from datetime import datetime
from django.core.management.base import BaseCommand
from django.conf import settings
from naming.models import NameTrendStat, TrendArticle

class Command(BaseCommand):
    help = 'Seeds name trend data from JSON file and mock data'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding NameTrendStat from JSON...')
        
        json_path = os.path.join(settings.BASE_DIR, 'trend_data.json')
        
        if not os.path.exists(json_path):
            self.stdout.write(self.style.ERROR(f'JSON file not found at {json_path}'))
            return

        NameTrendStat.objects.all().delete()
        
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        for item in data:
            NameTrendStat.objects.create(
                year=item['year'],
                gender='all',
                rank=item['rank'],
                name=item['name'],
                count=item['count'],
                hanja=''
            )
            
        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {len(data)} NameTrendStat records!'))

        self.stdout.write('Seeding TrendArticle mock data...')
        TrendArticle.objects.all().delete()
        
        articles = [
            {
                "category": "trend",
                "title": "2026년 작명 트렌드: 자연을 담은 중성적 이름의 부상",
                "summary": "올해 가장 눈에 띄는 변화는 중성적이고 부드러운 어감의 이름이 상위권을 휩쓸었다는 점입니다.",
                "paragraphs": ["올해 가장 눈에 띄는 변화는 중성적이고 부드러운 어감의 이름이 상위권을 휩쓸었다는 점입니다.", "특히 이든, 이안, 로아 등 받침이 적고 모음이 강조된 이름들이 성별을 불문하고 큰 사랑을 받고 있습니다."],
                "views": 4200,
                "date": "2026.06.15"
            },
            {
                "category": "hanja",
                "title": "뜻이 좋은 대법원 인명용 한자 추천: 밝은 의미 편",
                "summary": "밝고 긍정적인 의미를 담아 아이의 앞날을 환하게 비춰줄 한자들을 소개합니다.",
                "paragraphs": ["밝고 긍정적인 의미를 담아 아이의 앞날을 환하게 비춰줄 한자들을 소개합니다.", "대표적으로 밝을 명(明), 빛날 희(熙), 맑을 아(雅) 등이 꾸준히 선호되며, 최근에는 별 진(辰), 윤택할 윤(潤) 등의 한자도 많이 쓰입니다."],
                "views": 2800,
                "date": "2026.05.20"
            },
            {
                "category": "guide",
                "title": "좋은 이름의 조건: 발음과 사주의 조화",
                "summary": "부를 때 듣기 좋은 발음과 타고난 사주(기운)를 보완해 주는 한자의 조화는 작명의 핵심입니다.",
                "paragraphs": ["부를 때 듣기 좋은 발음과 타고난 사주(기운)를 보완해 주는 한자의 조화는 작명의 핵심입니다.", "전문가들은 이름은 하루에도 수십 번씩 불리는 만큼, 뜻만큼이나 발음의 편안함이 중요하다고 강조합니다."],
                "views": 5100,
                "date": "2026.04.11"
            }
        ]
        
        for art in articles:
            TrendArticle.objects.create(
                category=art["category"],
                title=art["title"],
                summary=art["summary"],
                paragraphs=art["paragraphs"],
                views=art["views"],
                date=datetime.strptime(art["date"], "%Y.%m.%d").date()
            )
            
        self.stdout.write(self.style.SUCCESS('Successfully seeded TrendArticle!'))

