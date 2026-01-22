from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import requests
import os
import logging

logger = logging.getLogger(__name__)

# This should be set in .env
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')

def verify_google_token(token):
    """
    Verify a Google token (ID Token or Access Token) and return the user info.
    """
    if not token:
        return None
        
    try:
        # 1. Handle access token passed from frontend (prefixed for clarity)
        if token.startswith('access_token_'):
            access_token = token.replace('access_token_', '')
            logger.info(f"Verifying access token: {access_token[:10]}...")
            return verify_access_token(access_token)
            
        # 2. Handle mock token
        if token.startswith('mock_token_'):
            return _get_mock_user_from_token(token)

        # 3. Handle ID Token (JWT)
        if GOOGLE_CLIENT_ID:
            try:
                id_info = id_token.verify_oauth2_token(token, google_requests.Request(), GOOGLE_CLIENT_ID)
                return {
                    'user_id': id_info['sub'],
                    'email': id_info.get('email'),
                    'name': id_info.get('name'),
                    'picture': id_info.get('picture')
                }
            except ValueError as e:
                logger.warning(f"ID Token verification failed: {e}")
                # If it's not a valid ID Token, it might be a raw access token
                return verify_access_token(token)
        else:
            # Fallback for real tokens if client ID is missing
            try:
                id_info = id_token.verify_oauth2_token(token, google_requests.Request(), audience=None)
                return {
                    'user_id': id_info['sub'],
                    'email': id_info.get('email'),
                    'name': id_info.get('name'),
                    'picture': id_info.get('picture')
                }
            except:
                return verify_access_token(token)

    except Exception as e:
        logger.exception(f"Unexpected token verification error: {e}")
        return None

def verify_access_token(access_token):
    """Verify an access token via Google's userinfo endpoint"""
    try:
        # Using Header instead of query param for better compatibility
        headers = {'Authorization': f'Bearer {access_token}'}
        response = requests.get('https://www.googleapis.com/oauth2/v3/userinfo', headers=headers)
        
        if response.status_code == 200:
            user_info = response.json()
            return {
                'user_id': user_info['sub'],
                'email': user_info.get('email'),
                'name': user_info.get('name'),
                'picture': user_info.get('picture')
            }
        else:
            logger.error(f"Google userinfo API returned {response.status_code}: {response.text}")
            return None
    except Exception as e:
        logger.error(f"Access token verification error: {e}")
        return None

def _get_mock_user_from_token(token):
    """Helper to generate mock user data from a mock token"""
    parts = token.split('_')
    if len(parts) >= 3:
        user_id = parts[2]
        email = parts[3] if len(parts) > 3 else f"user_{user_id}@example.com"
        return {
            'user_id': user_id,
            'email': email,
            'name': f"Mock User {user_id}",
            'picture': None
        }
    return {
        'user_id': 'mock_user_123',
        'email': 'mock@example.com',
        'name': 'Mock User',
        'picture': None
    }
