from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from rest_framework import generics
from .serializers import UserSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated
from allauth.socialaccount.models import SocialToken, SocialAccount
from django.contrib.auth.decorators import login_required
from rest_framework_simplejwt.tokens import RefreshToken
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from django.contrib.auth import get_user_model

User = get_user_model()

class UserCreate(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]


class UserDetailView(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

@login_required
def google_login_callback(request):
    user = request.user

    # Filter for social accounts linked to the current user
    social_accounts = SocialAccount.objects.filter(user=user).first()

    if not social_accounts:
        print("No social account found for user:", user)
        # Correcting the redirect URL as it had 'localhost5173' instead of 'localhost:5173'
        return redirect('http://localhost:5173/login/callback/?error=NoSocialAccount')

    # FIX: Changed 'account_provider' to 'app__provider' to correctly access the provider field
    # on the related SocialApp model through the 'app' ForeignKey on SocialToken.
    token = SocialToken.objects.filter(account=social_accounts, app__provider='google').first()

    if token:
        print('Google token found:', token.token)
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        return redirect(f'http://localhost:5173/login/callback/?access_token={access_token}')
    else:
        print('No Google token found for user:', user)
        return redirect(f'http://localhost:5173/login/callback/?error=NoGoogleToken')

@csrf_exempt
def validate_google_token(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            google_access_token = data.get('access_token')
            print(google_access_token)

            if not google_access_token:
                return JsonResponse({'detail':'Access Token is missing'}, status=400)
            return JsonResponse({'valid':True})
        except json.JSONDecodeError: # Corrected from JsonResponse.JSONDecodeError
            return JsonResponse({'detail':'Invalid JSON.'}, status=400)
    # This `return JsonResponse` was incorrectly indented and would only run if the method was not POST
    # It should be outside the `if request.method == 'POST'` block if it's meant for other methods.
    # For now, moved it to be aligned with the outer `if` for clarity, assuming it was a typo.
    # If only POST is allowed, this line is redundant as Django will return 405 by default.
    return JsonResponse({'detail':'Method not allowed'}, status=405)

from .utils import audit

def upload_resume_zip(request):
    # your existing upload logic...
    audit(request.user, "UPLOAD_ZIP", filename=zip_file.name, size=zip_file.size)
