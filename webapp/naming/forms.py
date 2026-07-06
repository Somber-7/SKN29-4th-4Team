from django import forms
from django.contrib.auth.models import User


class LoginForm(forms.Form):
    email = forms.EmailField()
    password = forms.CharField(min_length=8)


class SignupForm(forms.Form):
    name = forms.CharField(max_length=150)
    email = forms.EmailField()
    password = forms.CharField(min_length=8)

    def clean_email(self):
        email = self.cleaned_data["email"].strip().lower()
        if User.objects.filter(username=email).exists():
            raise forms.ValidationError("이미 가입된 이메일입니다.")
        return email


class ForgotPasswordForm(forms.Form):
    email = forms.EmailField()


class ChangePasswordForm(forms.Form):
    currentPassword = forms.CharField(min_length=8)
    nextPassword = forms.CharField(min_length=8)


class UpdateProfileForm(forms.Form):
    name = forms.CharField(max_length=150, required=False)
