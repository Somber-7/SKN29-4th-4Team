# ─── 최초 관리자 계정 생성 (관리자페이지 개발 계획서 §5.4 · §15.2) ─────────────
# 사용: python manage.py create_initial_admins
# 비밀번호는 시크릿 하드코딩 금지 원칙에 따라 ADMIN_INIT_PASSWORD 환경변수로만 받는다.

import os

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError

from naming.models import AdminProfile


class Command(BaseCommand):
    help = "ADMIN_INIT_PASSWORD 환경변수로 최초 SUPERADMIN 계정을 생성한다(이미 있으면 건너뜀)."

    def add_arguments(self, parser):
        parser.add_argument("--username", default="superadmin", help="관리자 로그인 ID (이메일 형식 금지)")
        parser.add_argument("--display-name", default="최고관리자")

    def handle(self, *args, **options):
        username = options["username"]
        if "@" in username:
            # 일반 회원은 username=email이므로, 관리자 계정명에 @를 금지해 네임스페이스
            # 충돌·위장 가입을 원천 차단한다(§4.1).
            raise CommandError("관리자 계정명에는 '@'를 쓸 수 없습니다(일반 회원 이메일과 네임스페이스 충돌 방지).")

        password = os.environ.get("ADMIN_INIT_PASSWORD")
        if not password:
            raise CommandError("ADMIN_INIT_PASSWORD 환경변수가 설정되어 있지 않습니다.")

        if User.objects.filter(username=username).exists():
            self.stdout.write(self.style.WARNING(f"'{username}' 계정이 이미 존재합니다 — 건너뜁니다."))
            return

        user = User.objects.create_user(
            username=username,
            password=password,
            is_staff=True,
            is_superuser=True,
        )
        AdminProfile.objects.create(
            user=user,
            role=AdminProfile.Role.SUPERADMIN,
            display_name=options["display_name"],
            must_change_password=True,
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"SUPERADMIN 계정 '{username}' 생성 완료 — 최초 로그인 시 비밀번호 변경이 강제됩니다."
            )
        )
