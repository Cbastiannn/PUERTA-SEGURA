"""
api/auth.py — Autenticación JWT mediante httpOnly cookies.
Más seguro que guardar el token en localStorage (evita XSS).
"""
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from django.conf import settings


class CookieJWTAuthentication(JWTAuthentication):
    """
    Busca el token JWT en la cookie 'access_token' (httpOnly).
    Si no está, cae al comportamiento estándar (header Authorization).
    """

    def authenticate(self, request):
        cookie_name = getattr(settings, 'SIMPLE_JWT', {}).get('AUTH_COOKIE', 'access_token')
        raw_token = request.COOKIES.get(cookie_name)

        if raw_token is None:
            # Intentar con header Authorization como fallback
            return super().authenticate(request)

        try:
            validated_token = self.get_validated_token(raw_token)
        except InvalidToken:
            return None

        return self.get_user(validated_token), validated_token
