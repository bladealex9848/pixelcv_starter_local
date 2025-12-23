# -*- coding: utf-8 -*-
"""Servicio de Autenticación - Registro, Login y JWT"""
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import os
import secrets
from sqlalchemy.orm import Session
from app.models.database import User, UserProfile

SECRET_KEY = os.getenv("JWT_SECRET_KEY", secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 días

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    """Servicio para manejar autenticación de usuarios"""
    
    @staticmethod
    def hash_password(password: str) -> str:
        return pwd_context.hash(password)
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def decode_token(token: str) -> Optional[dict]:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return payload
        except JWTError:
            return None
    
    @staticmethod
    def register_user(db: Session, email: str, username: str, password: str, full_name: str = None):
        existing_email = db.query(User).filter(User.email == email).first()
        if existing_email:
            raise ValueError("El email ya está registrado")
        existing_username = db.query(User).filter(User.username == username).first()
        if existing_username:
            raise ValueError("El nombre de usuario ya está en uso")
        
        user_id = str(datetime.utcnow().timestamp()) + secrets.token_hex(4)
        user = User(
            id=user_id,
            email=email,
            username=username,
            hashed_password=AuthService.hash_password(password),
            full_name=full_name or username,
            avatar_url=f"https://api.dicebear.com/7.x/avataaars/svg?seed={username}",
            is_active=True
        )
        db.add(user)
        profile = UserProfile(user_id=user_id, level=1, rank_title="Novato")
        db.add(profile)
        db.commit()
        db.refresh(user)
        
        token = AuthService.create_access_token(data={"sub": user_id})
        return user, token
    
    @staticmethod
    def login_user(db: Session, email: str, password: str):
        user = db.query(User).filter(User.email == email).first()
        if not user or not AuthService.verify_password(password, user.hashed_password):
            raise ValueError("Credenciales inválidas")
        if not user.is_active:
            raise ValueError("La cuenta está desactivada")
        token = AuthService.create_access_token(data={"sub": user.id})
        return user, token
    
    @staticmethod
    def get_current_user(db: Session, token: str) -> Optional[User]:
        payload = AuthService.decode_token(token)
        if not payload:
            return None
        user_id = payload.get("sub")
        if not user_id:
            return None
        return db.query(User).filter(User.id == user_id).first()
