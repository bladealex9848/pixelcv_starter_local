# -*- coding: utf-8 -*-
"""Rutas de autenticación - Registro, Login, Perfil"""
from fastapi import APIRouter, Depends, HTTPException, Body
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional

from app.models.database import get_db, User
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()


# Modelos Pydantic
class RegisterRequest(BaseModel):
    email: EmailStr
    username: str
    password: str
    full_name: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


# Dependencia para obtener el usuario actual
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Obtiene el usuario autenticado a partir del token JWT"""
    token = credentials.credentials
    user = AuthService.get_current_user(db, token)
    if not user:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    return user


@router.post("/register")
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Registra un nuevo usuario"""
    try:
        user, token = AuthService.register_user(
            db=db,
            email=request.email,
            username=request.username,
            password=request.password,
            full_name=request.full_name
        )
        return {
            "message": "Usuario registrado exitosamente",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
                "avatar_url": user.avatar_url
            },
            "token": token
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Inicia sesión de un usuario"""
    try:
        user, token = AuthService.login_user(
            db=db,
            email=request.email,
            password=request.password
        )
        return {
            "message": "Login exitoso",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
                "avatar_url": user.avatar_url
            },
            "token": token
        }
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    """Obtiene el perfil del usuario actual"""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "avatar_url": current_user.avatar_url,
        "bio": current_user.bio,
        "is_verified": current_user.is_verified,
        "created_at": current_user.created_at
    }


@router.put("/profile")
def update_profile(
    request: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Actualiza el perfil del usuario"""
    try:
        user = AuthService.update_user(
            db=db,
            user_id=current_user.id,
            full_name=request.full_name,
            bio=request.bio,
            avatar_url=request.avatar_url
        )
        return {
            "message": "Perfil actualizado",
            "user": {
                "id": user.id,
                "username": user.username,
                "full_name": user.full_name,
                "avatar_url": user.avatar_url,
                "bio": user.bio
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/change-password")
def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cambia la contraseña del usuario"""
    try:
        AuthService.change_password(
            db=db,
            user_id=current_user.id,
            current_password=request.current_password,
            new_password=request.new_password
        )
        return {"message": "Contraseña actualizada exitosamente"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
