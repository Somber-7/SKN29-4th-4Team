import re

from django import forms
from django.contrib.auth.models import User


PASSWORD_RE = re.compile(r"^(?=.*[A-Za-z])(?=.*\d)(?=.*[^\w\s])\S{8,15}$")
PASSWORD_HELP = "비밀번호는 영문, 숫자, 기호를 포함해 8~15자로 입력해 주세요."
USERNAME_RE = re.compile(r"^[A-Za-z0-9_]{4,20}$")
USERNAME_HELP = "아이디는 영문, 숫자, 밑줄(_)만 사용해 4~20자로 입력해 주세요."


def validate_password_strength(value):
    if not PASSWORD_RE.match(value):
        raise forms.ValidationError(PASSWORD_HELP)
    return value


class LoginForm(forms.Form):
    username = forms.CharField(min_length=4, max_length=20)
    password = forms.CharField(min_length=8, max_length=128)

    def clean_username(self):
        username = self.cleaned_data["username"].strip().lower()
        if not USERNAME_RE.match(username):
            raise forms.ValidationError(USERNAME_HELP)
        return username


class SignupForm(forms.Form):
    name = forms.CharField(max_length=150)
    username = forms.CharField(min_length=4, max_length=20)
    email = forms.EmailField()
    password = forms.CharField(min_length=8, max_length=15)
    termsAgreed = forms.BooleanField(required=True)
    privacyAgreed = forms.BooleanField(required=True)
    termsVersion = forms.CharField(max_length=20, required=False)
    privacyVersion = forms.CharField(max_length=20, required=False)

    def clean_name(self):
        return self.cleaned_data["name"].strip()

    def clean_username(self):
        username = self.cleaned_data["username"].strip().lower()
        if not USERNAME_RE.match(username):
            raise forms.ValidationError(USERNAME_HELP)
        if User.objects.filter(username__iexact=username).exists():
            raise forms.ValidationError("중복된 아이디가 있습니다.")
        return username

    def clean_email(self):
        email = self.cleaned_data["email"].strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise forms.ValidationError("중복된 이메일이 있습니다.")
        return email

    def clean_password(self):
        return validate_password_strength(self.cleaned_data["password"])

    def clean_termsVersion(self):
        return self.cleaned_data.get("termsVersion") or "2026-07-07"

    def clean_privacyVersion(self):
        return self.cleaned_data.get("privacyVersion") or "2026-07-07"


class CheckEmailForm(forms.Form):
    email = forms.EmailField()

    def clean_email(self):
        return self.cleaned_data["email"].strip().lower()


class PasswordResetIdentityForm(forms.Form):
    name = forms.CharField(max_length=150)
    username = forms.CharField(min_length=4, max_length=20)
    email = forms.EmailField()

    def clean_name(self):
        return self.cleaned_data["name"].strip()

    def clean_username(self):
        username = self.cleaned_data["username"].strip().lower()
        if not USERNAME_RE.match(username):
            raise forms.ValidationError(USERNAME_HELP)
        return username

    def clean_email(self):
        return self.cleaned_data["email"].strip().lower()


class ForgotPasswordForm(PasswordResetIdentityForm):
    nextPassword = forms.CharField(min_length=8, max_length=15)

    def clean_nextPassword(self):
        return validate_password_strength(self.cleaned_data["nextPassword"])


class ChangePasswordForm(forms.Form):
    currentPassword = forms.CharField(min_length=8, max_length=128)
    nextPassword = forms.CharField(min_length=8, max_length=15)

    def clean_nextPassword(self):
        return validate_password_strength(self.cleaned_data["nextPassword"])


class UpdateProfileForm(forms.Form):
    email = forms.EmailField(required=True)

    def __init__(self, *args, user=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.user = user

    def clean_email(self):
        email = self.cleaned_data["email"].strip().lower()
        qs = User.objects.filter(email__iexact=email)
        if self.user is not None:
            qs = qs.exclude(pk=self.user.pk)
        if qs.exists():
            raise forms.ValidationError("중복된 이메일이 있습니다.")
        return email


class WithdrawForm(forms.Form):
    currentPassword = forms.CharField(min_length=8, max_length=128)


class ContactForm(forms.Form):
    """SupportScreen.tsx ContactSection의 클라이언트 검증과 규칙을 맞춘다."""

    name = forms.CharField(max_length=50)
    email = forms.EmailField()
    topic = forms.CharField(max_length=50, required=False)
    subject = forms.CharField(max_length=200)
    message = forms.CharField(min_length=10)
