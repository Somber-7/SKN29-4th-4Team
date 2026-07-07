from django.conf import settings
from django.db import models

USER = settings.AUTH_USER_MODEL

# ── 공통 추상 베이스 (확장성: 이후 운영 모델이 감사 필드를 상속) ──
class TimeStamped(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

# ── 관리자 역할/프로필 (관리자페이지 개발 계획서 §9) ──
class AdminProfile(TimeStamped):
    class Role(models.TextChoices):
        SUPERADMIN = "SUPERADMIN", "최고관리자"
        ADMIN = "ADMIN", "운영관리자"
        ANALYST = "ANALYST", "분석/읽기전용"

    user = models.OneToOneField(USER, on_delete=models.CASCADE, related_name="admin_profile")
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.ADMIN)
    display_name = models.CharField(max_length=50)
    is_active_admin = models.BooleanField(default=True)
    must_change_password = models.BooleanField(default=True)
    failed_login_count = models.PositiveIntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        USER, null=True, blank=True, on_delete=models.SET_NULL, related_name="created_admins"
    )

    def __str__(self):
        return f"{self.user.username} ({self.role})"


# ── 일반 회원 프로필 ──
class UserProfile(TimeStamped):
    class Approval(models.TextChoices):
        PENDING = "PENDING", "승인 대기"
        APPROVED = "APPROVED", "승인"
        REJECTED = "REJECTED", "거절"

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "활성"
        SUSPENDED = "SUSPENDED", "정지"

    user = models.OneToOneField(USER, on_delete=models.CASCADE, related_name="profile")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    approval_status = models.CharField(
        max_length=20, choices=Approval.choices, default=Approval.APPROVED
    )
    rejected_reason = models.CharField(max_length=200, blank=True)
    approved_by = models.ForeignKey(
        USER, null=True, blank=True, on_delete=models.SET_NULL, related_name="approved_users"
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    
    # UserConsent 필드 통합
    terms_version = models.CharField(max_length=20, default="1.0")
    privacy_version = models.CharField(max_length=20, default="1.0")
    terms_agreed_at = models.DateTimeField(null=True, blank=True)
    privacy_agreed_at = models.DateTimeField(null=True, blank=True)
    agreed_ip = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=1000, blank=True)
    
    # ActiveUserTracking 대체 (마지막 활동 시간)
    last_seen_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} profile"


# ── 회원 로그인 이력 ──
class LoginHistory(models.Model):
    user = models.ForeignKey(USER, on_delete=models.CASCADE, related_name="login_history")
    ip = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=300, blank=True)
    success = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["user", "created_at"])]


# ── 관리자 감사 로그 ──
class AdminAuditLog(models.Model):
    class Action(models.TextChoices):
        VIEW_PII = "VIEW_PII", "PII 상세 조회"
        ROLE_CHANGE = "ROLE_CHANGE", "권한 변경"
        USER_UPDATE = "USER_UPDATE", "회원 수정"
        USER_DELETE = "USER_DELETE", "회원 삭제"
        APPROVE = "APPROVE", "가입 승인/거절"
        CONTENT = "CONTENT", "콘텐츠 변경"
        LOGIN = "LOGIN", "관리자 로그인"
        OTHER = "OTHER", "기타"

    actor = models.ForeignKey(USER, null=True, on_delete=models.SET_NULL, related_name="audit_logs")
    actor_username = models.CharField(max_length=150, blank=True)
    action = models.CharField(max_length=20, choices=Action.choices)
    target_type = models.CharField(max_length=50, blank=True)
    target_id = models.CharField(max_length=50, blank=True)
    detail = models.JSONField(default=dict, blank=True)
    ip = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["action", "created_at"]),
            models.Index(fields=["actor", "created_at"]),
        ]


# ── 서비스 설정 통합 ──
class Setting(models.Model):
    key = models.CharField(max_length=50, unique=True)
    value = models.JSONField(default=dict)
    updated_by = models.ForeignKey(USER, null=True, blank=True, on_delete=models.SET_NULL)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "naming_setting"

    def __str__(self):
        return self.key


# ── 공지사항 ──
class Notice(TimeStamped):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "임시"
        SCHEDULED = "SCHEDULED", "예약"
        PUBLISHED = "PUBLISHED", "게시"
        ENDED = "ENDED", "종료"

    title = models.CharField(max_length=200)
    body = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    is_pinned = models.BooleanField(default=False)
    start_at = models.DateTimeField(null=True, blank=True)
    end_at = models.DateTimeField(null=True, blank=True)
    updated_by = models.ForeignKey(USER, null=True, blank=True, on_delete=models.SET_NULL)

    class Meta:
        ordering = ["-is_pinned", "-updated_at"]

    def __str__(self):
        return self.title


# ── 문의 ──
class ContactInquiry(TimeStamped):
    class Status(models.TextChoices):
        RECEIVED = "received", "접수"
        IN_PROGRESS = "in_progress", "처리 중"
        ANSWERED = "answered", "답변 완료"

    user = models.ForeignKey(USER, null=True, blank=True, on_delete=models.SET_NULL, related_name="inquiries")
    name = models.CharField(max_length=50)
    email = models.EmailField()
    topic = models.CharField(max_length=50, blank=True)
    subject = models.CharField(max_length=200)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.RECEIVED)
    admin_reply = models.TextField(blank=True)
    answered_by = models.ForeignKey(USER, null=True, blank=True, on_delete=models.SET_NULL)
    answered_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.subject} ({self.email})"


# ── FAQ (카테고리 통합) ──
class FAQ(TimeStamped):
    category = models.CharField(max_length=50)
    question = models.CharField(max_length=200)
    answer = models.TextField()
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    updated_by = models.ForeignKey(USER, null=True, blank=True, on_delete=models.SET_NULL)

    class Meta:
        ordering = ["order", "-updated_at"]

    def __str__(self):
        return self.question


# ── 작명 기록 ──
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

# ── 일간 지표 (대시보드/통계용) ──
class DailyMetric(models.Model):
    date = models.DateField(unique=True)
    signups = models.PositiveIntegerField(default=0)
    logins = models.PositiveIntegerField(default=0)
    naming_requests = models.PositiveIntegerField(default=0)
    inquiries = models.PositiveIntegerField(default=0)
    answered_inquiries = models.PositiveIntegerField(default=0)
    source_distribution = models.JSONField(default=dict, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        return str(self.date)

