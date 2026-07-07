# ─── 관리자 API Ninja 스키마 (관리자페이지 개발 계획서 §10) ────────────────────
# 입력 XxxIn / 출력 XxxOut 컨벤션. 프론트 Zod 스키마(admin.ts)와 필드명을 맞춘다(§16.2).

from datetime import datetime
from typing import Any

from ninja import Schema

from .masking import mask_email, mask_name
from .models import UserProfile


class ErrorOut(Schema):
    """Ninja 예외 핸들러 공용 응답 — client.ts의 ApiError({status,message,detail})와 정렬."""

    status: int
    message: str
    detail: object | None = None


class LoginIn(Schema):
    username: str
    password: str


class ChangePasswordIn(Schema):
    currentPassword: str
    nextPassword: str


class MeOut(Schema):
    id: int
    username: str
    displayName: str
    role: str
    permissions: list[str]
    mustChangePassword: bool


# ─── 회원 관리 (§7·§9·§10, Phase 1) ─────────────────────────────────────────────
# 목록은 마스킹된 값만 담는다(§5.1) — resolve_*가 mask_email/mask_name을 거친다.
# 상세는 role에 따라 api.py가 mask 플래그를 넘겨 마스킹 여부를 분기한다(§5.2).


class UserListItemOut(Schema):
    id: int
    name: str
    email: str
    joinedAt: datetime
    status: str
    approvalStatus: str
    requests: int
    saved: int

    @staticmethod
    def resolve_name(obj):
        return mask_name(obj.first_name or obj.username)

    @staticmethod
    def resolve_email(obj):
        return mask_email(obj.email)

    @staticmethod
    def resolve_joinedAt(obj):
        return obj.date_joined

    @staticmethod
    def resolve_status(obj):
        profile = getattr(obj, "profile", None)
        return profile.status if profile else UserProfile.Status.ACTIVE

    @staticmethod
    def resolve_approvalStatus(obj):
        profile = getattr(obj, "profile", None)
        return profile.approval_status if profile else UserProfile.Approval.APPROVED

    @staticmethod
    def resolve_requests(obj):
        return getattr(obj, "requests_count", 0)

    @staticmethod
    def resolve_saved(obj):
        # 저장 이름(즐겨찾기) 기능은 아직 백엔드에 존재하지 않는다(사용자 화면도
        # history_view에서 savedCount=0 고정) — 별도 모델을 임의로 만들지 않고
        # 동일하게 0 고정. 기능이 생기면 이 resolver만 바꾸면 된다.
        return 0


class UserDetailOut(Schema):
    id: int
    name: str
    email: str
    joinedAt: datetime
    status: str
    approvalStatus: str
    rejectedReason: str
    requests: int
    saved: int
    masked: bool


class UserCreateIn(Schema):
    email: str
    name: str
    password: str


class UserUpdateIn(Schema):
    name: str | None = None
    email: str | None = None


class UserStatusIn(Schema):
    status: str  # ACTIVE | SUSPENDED


class UserApprovalIn(Schema):
    approvalStatus: str  # APPROVED | REJECTED
    rejectedReason: str = ""


class ActivityLogItemOut(Schema):
    id: int
    type: str  # "login" | "naming"
    createdAt: datetime
    detail: str
    success: bool | None = None
    results: list[dict] | None = None


class ActivityLogPageOut(Schema):
    """활동 로그는 login/naming 두 이질적 모델을 한 응답 모양으로 합치기 때문에,
    AdminPagination(@paginate)의 제네릭 List[Schema] 치환에 기대지 않고 직접
    {items,total,page,pageSize}를 만들어 반환한다(§10 응답 규약은 그대로 준수)."""

    items: list[ActivityLogItemOut]
    total: int
    page: int
    pageSize: int


class ServiceSettingOut(Schema):
    key: str
    value: Any


class ServiceSettingUpdateIn(Schema):
    value: Any


class SiteTextSettingOut(Schema):
    key: str
    label: str
    value: str
    description: str
    updatedAt: datetime

    @staticmethod
    def resolve_updatedAt(obj):
        return obj.updated_at


class SiteTextSettingUpdateIn(Schema):
    value: str


# ─── 관리자 계정 관리 (§10, Phase 4) ───────────────────────────

class AdminAccountOut(Schema):
    id: int
    username: str
    displayName: str
    role: str
    isActiveAdmin: bool
    mustChangePassword: bool
    failedLoginCount: int
    lockedUntil: datetime | None
    createdAt: datetime
    updatedAt: datetime

    @staticmethod
    def resolve_username(obj):
        return obj.user.username

    @staticmethod
    def resolve_displayName(obj):
        return obj.display_name

    @staticmethod
    def resolve_isActiveAdmin(obj):
        return obj.is_active_admin

    @staticmethod
    def resolve_mustChangePassword(obj):
        return obj.must_change_password

    @staticmethod
    def resolve_failedLoginCount(obj):
        return obj.failed_login_count

    @staticmethod
    def resolve_lockedUntil(obj):
        return obj.locked_until

    @staticmethod
    def resolve_createdAt(obj):
        return obj.created_at

    @staticmethod
    def resolve_updatedAt(obj):
        return obj.updated_at


class AdminAccountCreateIn(Schema):
    username: str
    displayName: str
    role: str
    password: str


class AdminAccountUpdateIn(Schema):
    displayName: str | None = None
    isActiveAdmin: bool | None = None


class AdminAccountRoleIn(Schema):
    role: str


# ─── 게시물 관리 (§9·§10, Phase 2 — 한자 화면 대체 §2.1) ───────────────────────────


class PostCategoryOut(Schema):
    id: int
    name: str
    order: int


class PostCategoryIn(Schema):
    name: str
    order: int = 0


class PostListItemOut(Schema):
    id: int
    title: str
    status: str
    categoryId: int
    categoryName: str
    authorName: str
    updatedAt: datetime

    @staticmethod
    def resolve_categoryId(obj):
        return obj.category_id

    @staticmethod
    def resolve_categoryName(obj):
        return obj.category.name

    @staticmethod
    def resolve_authorName(obj):
        if not obj.author:
            return "-"
        return obj.author.first_name or obj.author.username

    @staticmethod
    def resolve_updatedAt(obj):
        return obj.updated_at


class PostDetailOut(Schema):
    id: int
    title: str
    body: str
    status: str
    categoryId: int
    categoryName: str
    authorName: str
    publishedAt: datetime | None
    updatedAt: datetime

    @staticmethod
    def resolve_categoryId(obj):
        return obj.category_id

    @staticmethod
    def resolve_categoryName(obj):
        return obj.category.name

    @staticmethod
    def resolve_authorName(obj):
        if not obj.author:
            return "-"
        return obj.author.first_name or obj.author.username

    @staticmethod
    def resolve_publishedAt(obj):
        return obj.published_at

    @staticmethod
    def resolve_updatedAt(obj):
        return obj.updated_at


class PostCreateIn(Schema):
    title: str
    body: str
    categoryId: int
    status: str = "PRIVATE"


class PostUpdateIn(Schema):
    title: str | None = None
    body: str | None = None
    categoryId: int | None = None


class PostStatusIn(Schema):
    status: str  # PUBLISHED | PRIVATE | DELETED


# ─── 공지사항 관리 (§9·§10, Phase 2) ────────────────────────────────────────────
# 필드명은 전부 카멜케이스인데 Django 모델 속성은 스네이크케이스라, 자동 매핑되지
# 않는 필드는 반드시 resolve_*를 짝지어 준다(§10.1 게시물 스키마에서 겪은 버그 재발 방지).


class NoticeListItemOut(Schema):
    id: int
    title: str
    status: str
    isPinned: bool
    startAt: datetime | None
    endAt: datetime | None
    updatedAt: datetime

    @staticmethod
    def resolve_isPinned(obj):
        return obj.is_pinned

    @staticmethod
    def resolve_startAt(obj):
        return obj.start_at

    @staticmethod
    def resolve_endAt(obj):
        return obj.end_at

    @staticmethod
    def resolve_updatedAt(obj):
        return obj.updated_at


class NoticeDetailOut(Schema):
    id: int
    title: str
    body: str
    status: str
    isPinned: bool
    startAt: datetime | None
    endAt: datetime | None
    updatedAt: datetime

    @staticmethod
    def resolve_isPinned(obj):
        return obj.is_pinned

    @staticmethod
    def resolve_startAt(obj):
        return obj.start_at

    @staticmethod
    def resolve_endAt(obj):
        return obj.end_at

    @staticmethod
    def resolve_updatedAt(obj):
        return obj.updated_at


class NoticeCreateIn(Schema):
    title: str
    body: str
    status: str = "DRAFT"
    isPinned: bool = False
    startAt: datetime | None = None
    endAt: datetime | None = None


class NoticeUpdateIn(Schema):
    title: str | None = None
    body: str | None = None
    status: str | None = None
    isPinned: bool | None = None
    startAt: datetime | None = None
    endAt: datetime | None = None


# ─── 문의 관리 (§9·§10, Phase 2) ────────────────────────────────────────────────
# 접수(생성)는 공개 엔드포인트(views.py contact_submit_view)에서 이뤄진다 —
# 관리자 API는 목록·상세·답변만 다룬다(§10 표: GET 목록 / GET·PATCH 상세).


class InquiryListItemOut(Schema):
    id: int
    name: str
    email: str
    topic: str
    subject: str
    status: str
    createdAt: datetime

    @staticmethod
    def resolve_createdAt(obj):
        return obj.created_at


class InquiryDetailOut(Schema):
    id: int
    name: str
    email: str
    topic: str
    subject: str
    message: str
    status: str
    adminReply: str
    answeredAt: datetime | None
    createdAt: datetime

    @staticmethod
    def resolve_adminReply(obj):
        return obj.admin_reply

    @staticmethod
    def resolve_answeredAt(obj):
        return obj.answered_at

    @staticmethod
    def resolve_createdAt(obj):
        return obj.created_at


class InquiryReplyIn(Schema):
    status: str  # received | in_progress | answered
    adminReply: str | None = None


# ─── FAQ 관리 (§9·§10, Phase 2 — 관리자 CRUD만. 사용자 화면 연동은 백로그) ─────────


class FAQCategoryOut(Schema):
    id: int
    name: str
    order: int


class FAQCategoryIn(Schema):
    name: str
    order: int = 0


class FAQListItemOut(Schema):
    id: int
    question: str
    categoryId: int
    categoryName: str
    isActive: bool
    order: int
    updatedAt: datetime

    @staticmethod
    def resolve_categoryId(obj):
        mapping = {"service": 1, "evidence": 2, "account": 3}
        return mapping.get(obj.category, 1)

    @staticmethod
    def resolve_categoryName(obj):
        mapping = {"service": "서비스 이용", "evidence": "작명 근거", "account": "계정·이용권"}
        return mapping.get(obj.category, obj.category)

    @staticmethod
    def resolve_isActive(obj):
        return obj.is_active

    @staticmethod
    def resolve_updatedAt(obj):
        return obj.updated_at


class FAQDetailOut(Schema):
    id: int
    question: str
    answer: str
    categoryId: int
    categoryName: str
    isActive: bool
    order: int
    updatedAt: datetime

    @staticmethod
    def resolve_categoryId(obj):
        mapping = {"service": 1, "evidence": 2, "account": 3}
        return mapping.get(obj.category, 1)

    @staticmethod
    def resolve_categoryName(obj):
        mapping = {"service": "서비스 이용", "evidence": "작명 근거", "account": "계정·이용권"}
        return mapping.get(obj.category, obj.category)

    @staticmethod
    def resolve_isActive(obj):
        return obj.is_active

    @staticmethod
    def resolve_updatedAt(obj):
        return obj.updated_at


class FAQCreateIn(Schema):
    question: str
    answer: str
    categoryId: int
    isActive: bool = True
    order: int = 0


class FAQUpdateIn(Schema):
    question: str | None = None
    answer: str | None = None
    categoryId: int | None = None
    isActive: bool | None = None
    order: int | None = None


# ─── Phase 3: 대시보드·통계·헬스·감사 로그 ─────────────────────────────────────


class DashboardStatOut(Schema):
    label: str
    value: int
    suffix: str = ""
    delta: float


class WeeklyRequestOut(Schema):
    day: str
    요청: int
    추천: int


class SourceDistributionOut(Schema):
    name: str
    count: int


class RecentRequestOut(Schema):
    id: int
    time: str
    user: str
    query: str
    results: int
    status: str


class DashboardOut(Schema):
    stats: list[DashboardStatOut]
    weeklyRequests: list[WeeklyRequestOut]
    sourceDistribution: list[SourceDistributionOut]
    recentRequests: list[RecentRequestOut]


class StatsPointOut(Schema):
    date: str
    signups: int
    logins: int
    namingRequests: int
    inquiries: int
    answeredInquiries: int


class StatsSummaryOut(Schema):
    signups: int
    logins: int
    namingRequests: int
    inquiries: int
    answeredInquiries: int
    pendingInquiries: int


class StatsOut(Schema):
    points: list[StatsPointOut]
    summary: StatsSummaryOut
    sourceDistribution: list[SourceDistributionOut]


class HealthServiceOut(Schema):
    name: str
    status: str
    detail: str


class HealthOut(Schema):
    status: str
    checkedAt: datetime
    services: list[HealthServiceOut]


class AuditLogItemOut(Schema):
    id: int
    actorUsername: str
    action: str
    targetType: str
    targetId: str
    detail: Any
    ip: str | None
    createdAt: datetime

    @staticmethod
    def resolve_actorUsername(obj):
        return obj.actor_username

    @staticmethod
    def resolve_targetType(obj):
        return obj.target_type

    @staticmethod
    def resolve_targetId(obj):
        return obj.target_id

    @staticmethod
    def resolve_createdAt(obj):
        return obj.created_at


# ─── 문의 답변 템플릿 스키마 (Phase 6) ───
class InquiryReplyTemplateIn(Schema):
    category: str = ""
    title: str
    body: str
    isActive: bool = True


class InquiryReplyTemplateOut(Schema):
    id: int
    category: str
    title: str
    body: str
    isActive: bool
    usageCount: int
    createdAt: datetime
    updatedAt: datetime

    @staticmethod
    def resolve_isActive(obj):
        return obj.is_active

    @staticmethod
    def resolve_usageCount(obj):
        return obj.usage_count

    @staticmethod
    def resolve_createdAt(obj):
        return obj.created_at

    @staticmethod
    def resolve_updatedAt(obj):
        return obj.updated_at


# ─── API 모니터링 스키마 (Phase 8) ───
class ApiUsageSummaryPointOut(Schema):
    date: str
    requests: int
    failures: int
    failureRate: float
    avgLatency: float
    totalCost: float
    promptTokens: int
    completionTokens: int


class ApiUsageStatsOut(Schema):
    totalRequests: int
    failureRate: float
    avgLatency: float
    totalCost: float
    points: list[ApiUsageSummaryPointOut]


class ApiErrorLogItemOut(Schema):
    id: int
    createdAt: datetime
    endpoint: str
    statusCode: int
    errorType: str
    latencyMs: int
    modelName: str

    @staticmethod
    def resolve_createdAt(obj):
        return obj.created_at

    @staticmethod
    def resolve_statusCode(obj):
        return obj.status_code

    @staticmethod
    def resolve_errorType(obj):
        return obj.error_type

    @staticmethod
    def resolve_latencyMs(obj):
        return obj.latency_ms

    @staticmethod
    def resolve_modelName(obj):
        return obj.model_name
class AdminStatOut(Schema):
    label: str
    value: int
    suffix: str | None = None
    delta: int

class AdminWeeklyRequestOut(Schema):
    day: str
    naming: int
    inquiries: int

class AdminSourceDistributionOut(Schema):
    name: str
    count: int

class AdminDashboardBundleOut(Schema):
    stats: list[AdminStatOut]
    weeklyRequests: list[AdminWeeklyRequestOut]
    sourceDistribution: list[AdminSourceDistributionOut]

class AdminStatsPointOut(Schema):
    date: str
    signups: int
    logins: int
    namingRequests: int
    inquiries: int
    answeredInquiries: int

class AdminStatsSummaryOut(Schema):
    signups: int
    logins: int
    namingRequests: int
    inquiries: int
    answeredInquiries: int
    pendingInquiries: int

class AdminStatsBundleOut(Schema):
    points: list[AdminStatsPointOut]
    summary: AdminStatsSummaryOut
    sourceDistribution: list[AdminSourceDistributionOut]

class AdminHealthServiceOut(Schema):
    name: str
    status: str
    detail: str

class AdminHealthOut(Schema):
    status: str
    checkedAt: str
    services: list[AdminHealthServiceOut]
