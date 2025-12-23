# -*- coding: utf-8 -*-
"""Modelos de base de datos SQLite para PixelCV - Sistema de Comunidad y Gamificación"""
from sqlalchemy import create_engine, Column, String, Integer, Text, Boolean, DateTime, Float, ForeignKey, JSON, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

DATABASE_URL = os.getenv("PIXELCV_DB_URL", "sqlite:///./pixelcv.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    """Usuario de la plataforma"""
    __tablename__ = "users"
    
    id = Column(String, primary_key=True)
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    avatar_url = Column(String, default="")
    bio = Column(Text)
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    profile = relationship("UserProfile", back_populates="user", uselist=False)
    cvs = relationship("CV", back_populates="user")
    comments = relationship("Comment", back_populates="user")
    likes = relationship("Like", back_populates="user")
    visits = relationship("Visit", back_populates="user")


class UserProfile(Base):
    """Perfil extendido del usuario con estadísticas gamificadas"""
    __tablename__ = "user_profiles"
    
    user_id = Column(String, ForeignKey("users.id"), primary_key=True)
    
    # Estadísticas
    total_points = Column(Integer, default=0)
    level = Column(Integer, default=1)
    experience = Column(Integer, default=0)
    rank_title = Column(String, default="Novato")  # Novato, Aprendiz, Maestro, Leyenda
    
    # Contadores
    cvs_created = Column(Integer, default=0)
    cvs_published = Column(Integer, default=0)
    total_visits_received = Column(Integer, default=0)
    total_likes_given = Column(Integer, default=0)
    total_likes_received = Column(Integer, default=0)
    total_comments = Column(Integer, default=0)
    
    # Badges (almacenados como JSON)
    badges = Column(JSON, default=list)  # ["early_adopter", "top_creator", "social_butterfly", etc.]
    
    # Configuración
    theme_preference = Column(String, default="classic")
    notifications_enabled = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    user = relationship("User", back_populates="profile")
    points_history = relationship("PointHistory", back_populates="user_profile")


class CV(Base):
    """CV creado por un usuario"""
    __tablename__ = "cvs"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Contenido del CV
    name = Column(String, nullable=False)  # Nombre del propietario del CV
    slug = Column(String, unique=True, nullable=False, index=True)  # URL-friendly
    yaml_content = Column(Text, nullable=False)  # Contenido YAML completo
    json_content = Column(Text)  # Contenido JSON para fácil acceso
    
    # Diseño
    design = Column(JSON, default={})  # Configuración de diseño (theme, colores, etc.)
    
    # Estado de publicación
    is_published = Column(Boolean, default=False)
    is_featured = Column(Boolean, default=False)  # CV destacado por la plataforma
    published_at = Column(DateTime)
    
    # Estadísticas
    total_visits = Column(Integer, default=0)
    total_likes = Column(Integer, default=0)
    total_comments = Column(Integer, default=0)
    share_count = Column(Integer, default=0)  # Contador de veces compartido
    
    # Archivos generados
    pdf_path = Column(String)
    png_path = Column(String)
    html_path = Column(String)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    user = relationship("User", back_populates="cvs")
    comments = relationship("Comment", back_populates="cv")
    likes = relationship("Like", back_populates="cv")
    visits = relationship("Visit", back_populates="cv")


class PointHistory(Base):
    """Historial de puntos ganados por un usuario"""
    __tablename__ = "point_history"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    user_profile_id = Column(String, ForeignKey("user_profiles.user_id"), nullable=False)
    
    points = Column(Integer, nullable=False)  # Positivo para ganar, negativo para perder
    action = Column(String, nullable=False)  # cv_created, cv_published, visit_received, comment_posted, etc.
    description = Column(Text)
    related_cv_id = Column(String, ForeignKey("cvs.id"))
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relaciones
    user_profile = relationship("UserProfile", back_populates="points_history")


class Visit(Base):
    """Registro de visitas a un CV (para gamificación)"""
    __tablename__ = "visits"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    cv_id = Column(String, ForeignKey("cvs.id"), nullable=False)
    visitor_id = Column(String, ForeignKey("users.id"))  # Null si es visitante anónimo
    visitor_ip = Column(String)  # Para evitar spam de visitas del mismo usuario
    visitor_user_agent = Column(String)
    referrer = Column(String)  # De dónde vino la visita
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Índice para estadísticas rápidas
    __table_args__ = (
        Index('idx_cv_visit_date', 'cv_id', 'created_at'),
    )
    
    # Relaciones
    cv = relationship("CV", back_populates="visits")
    user = relationship("User", back_populates="visits")


class Comment(Base):
    """Comentarios en CVs"""
    __tablename__ = "comments"
    
    id = Column(String, primary_key=True)
    cv_id = Column(String, ForeignKey("cvs.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    content = Column(Text, nullable=False)
    parent_id = Column(String, ForeignKey("comments.id"))  # Para respuestas anidadas
    
    is_edited = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    cv = relationship("CV", back_populates="comments")
    user = relationship("User", back_populates="comments")


class Like(Base):
    """Likes/Megusta en CVs"""
    __tablename__ = "likes"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    cv_id = Column(String, ForeignKey("cvs.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Índice único para evitar likes duplicados
    __table_args__ = (
        Index('idx_cv_user_like', 'cv_id', 'user_id', unique=True),
    )
    
    # Relaciones
    cv = relationship("CV", back_populates="likes")
    user = relationship("User", back_populates="likes")


# Función para inicializar la base de datos
def init_db():
    """Crea todas las tablas en la base de datos"""
    Base.metadata.create_all(bind=engine)


# Función para obtener sesión de base de datos
def get_db():
    """Dependency injection para obtener sesión de BD"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Sistema de niveles y puntos
LEVEL_THRESHOLDS = {
    1: 0,        # Novato
    2: 100,      # Aprendiz
    3: 500,      # Maestro
    4: 1500,     # Experto
    5: 5000,     # Leyenda
}

POINT_VALUES = {
    'cv_created': 10,
    'cv_published': 50,
    'visit_received': 5,
    'comment_posted': 15,
    'comment_received': 10,
    'like_given': 2,
    'like_received': 20,
    'share_received': 25,
    'profile_completed': 30,
    'badge_earned': 100,
}

BADGES = {
    'early_adopter': {'name': 'Pionero', 'description': 'Uno de los primeros 100 usuarios', 'icon': '🚀'},
    'top_creator': {'name': 'Top Creador', 'description': '10+ CVs publicados', 'icon': '🏆'},
    'social_butterfly': {'name': 'Mariposa Social', 'description': '50+ comentarios', 'icon': '💬'},
    'popular': {'name': 'Popular', 'description': '100+ likes recibidos', 'icon': '⭐'},
    'viral': {'name': 'Viral', 'description': '1000+ visitas en un CV', 'icon': '🔥'},
    'legend': {'name': 'Leyenda', 'description': 'Nivel 5 alcanzado', 'icon': '👑'},
    'helper': {'name': 'Ayudante', 'description': '20+ likes en comentarios', 'icon': '🤝'},
}