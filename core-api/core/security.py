"""
Seguridad y Autenticación - Nexus POS
Hashing de passwords y generación de tokens JWT
"""
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt
import bcrypt
from core.config import settings


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica que un password en texto plano coincida con el hash
    """
    try:
        password_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception as e:
        print(f"Error verifying password: {e}")
        return False


def get_password_hash(password: str) -> str:
    """
    Genera un hash bcrypt de un password en texto plano
    """
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Crea un token JWT con payload personalizado
    
    Args:
        data: Diccionario con la información a codificar (ej: {"sub": user_id})
        expires_delta: Tiempo de expiración opcional
    
    Returns:
        Token JWT firmado como string
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    return encoded_jwt
