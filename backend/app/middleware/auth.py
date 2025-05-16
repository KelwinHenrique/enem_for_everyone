from functools import wraps
from flask import request, jsonify
import jwt
from firebase_admin import auth
from app.config import SECRET_KEY

def token_required(f):
    """Decorator to verify Firebase JWT token in the Authorization header"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Check if token is in headers
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({
                'success': False,
                'error': 'Autenticação necessária para acessar este recurso.',
                'code': 'UNAUTHORIZED'
            }), 401
        
        try:
            # Verify Firebase token
            decoded_token = auth.verify_id_token(token)
            request.user = decoded_token
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({
                'success': False,
                'error': 'Token inválido ou expirado.',
                'code': 'INVALID_TOKEN'
            }), 401
    
    return decorated

def get_user_id():
    """Helper function to get user ID from the request"""
    if hasattr(request, 'user') and request.user:
        return request.user.get('uid')
    return None
