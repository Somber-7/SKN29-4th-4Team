import json

from django.contrib.auth.models import User
from django.core.management import call_command
from django.test import Client, TestCase
from django.test.client import RequestFactory
from django.utils import timezone

from .auth import ROLE_ORDER, permissions_for, require_role
from .models import (
    AdminAuditLog,
    AdminProfile,
    ContactInquiry,
    DailyMetric,
    FAQ,
    NamingHistory,
    Notice,
    Setting,
    UserProfile,
)

ADMIN_LOGIN_URL = "/api/admin/login"
ADMIN_ME_URL = "/api/admin/me"
ADMIN_LOGOUT_URL = "/api/admin/logout"
ADMIN_USERS_URL = "/api/admin/users"
ADMIN_NOTICES_URL = "/api/admin/notices"
ADMIN_INQUIRIES_URL = "/api/admin/inquiries"
ADMIN_FAQS_URL = "/api/admin/faqs"
ADMIN_FAQ_CATEGORIES_URL = "/api/admin/faq-categories"
ADMIN_DASHBOARD_URL = "/api/admin/dashboard/"
ADMIN_STATS_URL = "/api/admin/stats/"
ADMIN_HEALTH_URL = "/api/admin/system/health"
ADMIN_AUDIT_LOGS_URL = "/api/admin/audit-logs/"

USER_LOGIN_URL = "/api/auth/login"
USER_SIGNUP_URL = "/api/auth/signup"
USER_ME_URL = "/api/me"
CONTACT_SUBMIT_URL = "/api/support/contact"

ADMIN_COOKIE = "admin_sessionid"
USER_COOKIE = "sessionid"


def _post_json(client: Client, url: str, payload: dict):
    return client.post(url, data=json.dumps(payload), content_type="application/json")


def _patch_json(client: Client, url: str, payload: dict):
    return client.patch(url, data=json.dumps(payload), content_type="application/json")


def _put_json(client: Client, url: str, payload: dict):
    return client.put(url, data=json.dumps(payload), content_type="application/json")


def _signup_payload(username: str, email: str, name: str = "Test User") -> dict:
    return {
        "name": name,
        "username": username,
        "email": email,
        "password": "pw12345!",
        "termsAgreed": True,
        "privacyAgreed": True,
    }


class AdminAuthUnitTests(TestCase):
    def test_permissions_for_role_hierarchy(self):
        analyst_perms = set(permissions_for(AdminProfile.Role.ANALYST))
        admin_perms = set(permissions_for(AdminProfile.Role.ADMIN))
        superadmin_perms = set(permissions_for(AdminProfile.Role.SUPERADMIN))

        self.assertTrue(analyst_perms.issubset(admin_perms))
        self.assertTrue(admin_perms.issubset(superadmin_perms))
        self.assertIn("dashboard.view", analyst_perms)
        self.assertNotIn("accounts.manage", analyst_perms)
        self.assertNotIn("accounts.manage", admin_perms)
        self.assertIn("accounts.manage", superadmin_perms)

    def test_require_role_rejects_insufficient_role(self):
        from ninja.errors import HttpError

        user = User.objects.create_user(username="analyst1", password="pw12345!", is_staff=True)
        profile = AdminProfile.objects.create(
            user=user,
            role=AdminProfile.Role.ANALYST,
            display_name="Analyst",
            must_change_password=False,
        )
        request = RequestFactory().get("/api/admin/dummy")
        request.user = user
        request.admin_profile = profile

        checker = require_role(AdminProfile.Role.SUPERADMIN)
        with self.assertRaises(HttpError) as cm:
            checker(request)
        self.assertEqual(cm.exception.status_code, 403)

    def test_role_order_is_monotonic(self):
        self.assertLess(ROLE_ORDER[AdminProfile.Role.ANALYST], ROLE_ORDER[AdminProfile.Role.ADMIN])
        self.assertLess(ROLE_ORDER[AdminProfile.Role.ADMIN], ROLE_ORDER[AdminProfile.Role.SUPERADMIN])


class AdminSessionTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.admin_user = User.objects.create_user(username="admin1", password="adminpw123", is_staff=True)
        AdminProfile.objects.create(
            user=self.admin_user,
            role=AdminProfile.Role.ADMIN,
            display_name="Admin",
            must_change_password=False,
        )
        self.member = User.objects.create_user(username="member01", password="memberpw123", email="member@example.com")

    def test_anonymous_gets_401(self):
        res = self.client.get(ADMIN_ME_URL)
        self.assertEqual(res.status_code, 401)

    def test_non_staff_gets_403_even_with_admin_cookie_name(self):
        self.client.login(username="member01", password="memberpw123")
        session_cookie = self.client.cookies.get(USER_COOKIE)
        self.assertIsNotNone(session_cookie)
        self.client.cookies[ADMIN_COOKIE] = session_cookie.value

        res = self.client.get(ADMIN_ME_URL)
        self.assertEqual(res.status_code, 403)

    def test_admin_login_logout(self):
        res = _post_json(self.client, ADMIN_LOGIN_URL, {"username": "admin1", "password": "adminpw123"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["role"], "ADMIN")
        self.assertIn(ADMIN_COOKIE, res.cookies)

        res = self.client.post(ADMIN_LOGOUT_URL)
        self.assertEqual(res.status_code, 200)


class PublicAuthTests(TestCase):
    def setUp(self):
        self.client = Client()

    def test_signup_requires_current_payload_contract_and_login_uses_username(self):
        res = _post_json(self.client, USER_SIGNUP_URL, _signup_payload("user01", "user01@example.com"))
        self.assertEqual(res.status_code, 201)

        user = User.objects.get(username="user01")
        profile = UserProfile.objects.get(user=user)
        self.assertEqual(profile.approval_status, UserProfile.Approval.APPROVED)

        res = _post_json(self.client, USER_LOGIN_URL, {"email": "user01@example.com", "password": "pw12345!"})
        self.assertEqual(res.status_code, 400)

        res = _post_json(self.client, USER_LOGIN_URL, {"username": "user01", "password": "pw12345!"})
        self.assertEqual(res.status_code, 200)

    def test_withdrawal_is_hard_delete_and_allows_rejoin(self):
        payload = _signup_payload("withdraw01", "withdraw@example.com", "Withdraw")
        res = _post_json(self.client, USER_SIGNUP_URL, payload)
        self.assertEqual(res.status_code, 201)
        user_id = User.objects.get(username="withdraw01").id

        res = _post_json(self.client, USER_LOGIN_URL, {"username": "withdraw01", "password": "pw12345!"})
        self.assertEqual(res.status_code, 200)
        res = self.client.delete(
            USER_ME_URL,
            data=json.dumps({"currentPassword": "pw12345!"}),
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 204)
        self.assertFalse(User.objects.filter(pk=user_id).exists())

        res = _post_json(Client(), USER_SIGNUP_URL, payload)
        self.assertEqual(res.status_code, 201)
        self.assertEqual(User.objects.filter(username="withdraw01").count(), 1)


class AdminUserApiTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.admin_user = User.objects.create_user(username="admin2", password="adminpw123", is_staff=True)
        AdminProfile.objects.create(
            user=self.admin_user,
            role=AdminProfile.Role.ADMIN,
            display_name="Admin",
            must_change_password=False,
        )
        self.member = User.objects.create_user(
            username="member02",
            password="memberpw123",
            email="member02@example.com",
            first_name="Member",
        )
        UserProfile.objects.create(user=self.member)

    def _login_admin(self):
        res = _post_json(self.client, ADMIN_LOGIN_URL, {"username": "admin2", "password": "adminpw123"})
        self.assertEqual(res.status_code, 200)

    def test_admin_can_list_and_hard_delete_user(self):
        self._login_admin()
        res = self.client.get(ADMIN_USERS_URL + "/")
        self.assertEqual(res.status_code, 200)
        self.assertGreaterEqual(res.json()["total"], 1)

        res = self.client.delete(f"{ADMIN_USERS_URL}/{self.member.id}")
        self.assertEqual(res.status_code, 200)
        self.assertFalse(User.objects.filter(pk=self.member.id).exists())
        self.assertEqual(AdminAuditLog.objects.filter(action=AdminAuditLog.Action.USER_DELETE).count(), 1)


class AdminContentApiTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.admin_user = User.objects.create_user(username="admin3", password="adminpw123", is_staff=True)
        AdminProfile.objects.create(
            user=self.admin_user,
            role=AdminProfile.Role.ADMIN,
            display_name="Admin",
            must_change_password=False,
        )
        self.analyst_user = User.objects.create_user(username="analyst3", password="analystpw123", is_staff=True)
        AdminProfile.objects.create(
            user=self.analyst_user,
            role=AdminProfile.Role.ANALYST,
            display_name="Analyst",
            must_change_password=False,
        )

    def _login_admin(self):
        res = _post_json(self.client, ADMIN_LOGIN_URL, {"username": "admin3", "password": "adminpw123"})
        self.assertEqual(res.status_code, 200)

    def _login_analyst(self):
        res = _post_json(self.client, ADMIN_LOGIN_URL, {"username": "analyst3", "password": "analystpw123"})
        self.assertEqual(res.status_code, 200)

    def test_analyst_cannot_access_content_crud(self):
        self._login_analyst()
        self.assertEqual(self.client.get(ADMIN_NOTICES_URL + "/").status_code, 403)
        self.assertEqual(self.client.get(ADMIN_INQUIRIES_URL + "/").status_code, 403)
        self.assertEqual(self.client.get(ADMIN_FAQS_URL + "/").status_code, 403)

    def test_notice_create_and_delete(self):
        self._login_admin()
        res = _post_json(
            self.client,
            ADMIN_NOTICES_URL + "/",
            {"title": "Notice", "body": "Body", "status": "PUBLISHED", "isPinned": True},
        )
        self.assertEqual(res.status_code, 201)
        notice_id = res.json()["id"]

        res = self.client.delete(f"{ADMIN_NOTICES_URL}/{notice_id}")
        self.assertEqual(res.status_code, 200)
        self.assertFalse(Notice.objects.filter(pk=notice_id).exists())

    def test_public_contact_flows_to_admin_inquiry_reply(self):
        res = _post_json(
            self.client,
            CONTACT_SUBMIT_URL,
            {
                "name": "Guest",
                "email": "guest@example.com",
                "topic": "service",
                "subject": "Question",
                "message": "This is a valid inquiry message.",
            },
        )
        self.assertEqual(res.status_code, 201)
        inquiry = ContactInquiry.objects.get(email="guest@example.com")

        self._login_admin()
        res = _patch_json(
            self.client,
            f"{ADMIN_INQUIRIES_URL}/{inquiry.id}",
            {"status": "answered", "adminReply": "Done"},
        )
        self.assertEqual(res.status_code, 200)
        inquiry.refresh_from_db()
        self.assertEqual(inquiry.status, ContactInquiry.Status.ANSWERED)
        self.assertEqual(inquiry.admin_reply, "Done")

    def test_faq_uses_string_category_contract(self):
        self._login_admin()
        res = self.client.get(ADMIN_FAQ_CATEGORIES_URL + "/")
        self.assertEqual(res.status_code, 200)
        self.assertGreaterEqual(len(res.json()), 1)

        res = _post_json(
            self.client,
            ADMIN_FAQS_URL + "/",
            {"question": "How?", "answer": "Like this.", "categoryId": 1, "isActive": True},
        )
        self.assertEqual(res.status_code, 201)
        faq_id = res.json()["id"]
        self.assertEqual(FAQ.objects.get(pk=faq_id).category, "service")

        res = _put_json(self.client, f"{ADMIN_FAQS_URL}/{faq_id}", {"isActive": False})
        self.assertEqual(res.status_code, 200)
        self.assertFalse(res.json()["isActive"])


class AdminMetricsApiTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.super_user = User.objects.create_user(username="super1", password="adminpw123", is_staff=True)
        AdminProfile.objects.create(
            user=self.super_user,
            role=AdminProfile.Role.SUPERADMIN,
            display_name="Super",
            must_change_password=False,
        )
        self.analyst_user = User.objects.create_user(username="analyst4", password="analystpw123", is_staff=True)
        AdminProfile.objects.create(
            user=self.analyst_user,
            role=AdminProfile.Role.ANALYST,
            display_name="Analyst",
            must_change_password=False,
        )
        DailyMetric.objects.create(
            date=timezone.localdate(),
            signups=1,
            logins=2,
            naming_requests=3,
            inquiries=4,
            answered_inquiries=1,
            source_distribution={"rag": 2},
        )
        NamingHistory.objects.create(
            user=User.objects.create_user(username="metricuser", password="pw12345!"),
            query_text="name",
            results=[{"hangul": "A"}],
        )
        AdminAuditLog.objects.create(
            actor=self.super_user,
            actor_username="super1",
            action=AdminAuditLog.Action.CONTENT,
            target_type="FAQ",
            target_id="1",
            detail={"action": "create"},
        )

    def _login_super(self, client=None):
        client = client or self.client
        res = _post_json(client, ADMIN_LOGIN_URL, {"username": "super1", "password": "adminpw123"})
        self.assertEqual(res.status_code, 200)

    def _login_analyst(self):
        res = _post_json(self.client, ADMIN_LOGIN_URL, {"username": "analyst4", "password": "analystpw123"})
        self.assertEqual(res.status_code, 200)

    def test_analyst_cannot_view_admin_metrics_endpoints(self):
        self._login_analyst()
        self.assertEqual(self.client.get(ADMIN_DASHBOARD_URL).status_code, 403)
        self.assertEqual(self.client.get(ADMIN_STATS_URL).status_code, 403)
        self.assertEqual(self.client.get(ADMIN_HEALTH_URL).status_code, 403)

    def test_admin_can_view_dashboard_stats_health_and_audit_logs(self):
        self._login_super()
        res = self.client.get(ADMIN_DASHBOARD_URL)
        self.assertEqual(res.status_code, 200)
        self.assertIn("weeklyRequests", res.json())

        res = self.client.get(ADMIN_STATS_URL)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["summary"]["namingRequests"], 3)

        res = self.client.get(ADMIN_HEALTH_URL)
        self.assertEqual(res.status_code, 200)
        self.assertIn("services", res.json())

        res = self.client.get(ADMIN_AUDIT_LOGS_URL)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["items"][0]["actorUsername"], "super1")

    def test_aggregate_daily_stats_is_idempotent(self):
        call_command("aggregate_daily_stats", days=1)
        call_command("aggregate_daily_stats", days=1)
        self.assertEqual(DailyMetric.objects.filter(date=timezone.localdate()).count(), 1)


class SettingsModelTests(TestCase):
    def test_setting_replaces_legacy_service_setting_model_name(self):
        Setting.objects.create(key="signup_requires_approval", value={"enabled": False})
        self.assertEqual(Setting.objects.get(key="signup_requires_approval").value["enabled"], False)
