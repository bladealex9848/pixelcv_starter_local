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
    game_sessions = relationship("GameSession", back_populates="user")


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


class GameSession(Base):
    """Sesión de juego para el sistema de gamificación arcade"""
    __tablename__ = "game_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)  # Null para demo mode
    game_id = Column(String, nullable=False)  # pong, tictactoe, memory, snake, etc.

    # Resultados del juego
    score = Column(Integer, default=0)
    won = Column(Boolean, default=False)  # Para juegos con win/loss
    moves = Column(Integer, default=0)  # Para juegos de turnos o puntuación por movimientos
    time_seconds = Column(Integer, default=0)  # Tiempo de duración

    # Datos adicionales del juego (JSON flexible)
    game_data = Column(JSON, default={})  # Para guardar datos específicos de cada juego

    # Puntos calculados
    points_earned = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Índice para leaderboard de cada juego
    __table_args__ = (
        Index('idx_game_score', 'game_id', 'score'),
        Index('idx_user_games', 'user_id', 'game_id'),
    )

    # Relaciones
    user = relationship("User", back_populates="game_sessions")
    training_data = relationship("GameTrainingData", back_populates="session", uselist=False)


class GameAIParameters(Base):
    """Parámetros configurables para IA de juegos (sistema offline)"""
    __tablename__ = "game_ai_parameters"

    id = Column(Integer, primary_key=True, autoincrement=True)
    game_id = Column(String, nullable=False)  # pong, tictactoe, spaceinvaders, etc.
    difficulty = Column(String, nullable=False)  # easy, medium, hard, expert

    # Parámetros serializados como JSON (estructura flexible por juego)
    # Pong: {base_error: 15.0, reaction_delay_chance: 0.05, max_bounces: 2}
    # TicTacToe: {error_chance: 0.15, max_depth: 4, position_weights: [...]}
    parameters = Column(JSON, nullable=False)

    # Metadatos
    version = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)

    # Estadísticas de rendimiento (para analizar si params son buenos)
    total_games_trained = Column(Integer, default=0)  # Partidas analizadas para estos params
    win_rate_vs_players = Column(Float, default=0.5)  # Win rate de IA contra jugadores
    avg_score_diff = Column(Float, default=0.0)  # Diferencia promedio de score

    # Información de entrenamiento
    trained_at = Column(DateTime)  # Última vez que IA entrenó estos params
    created_at = Column(DateTime, default=datetime.utcnow)

    # Índices
    __table_args__ = (
        Index('idx_game_diff_params', 'game_id', 'difficulty', 'is_active'),
    )


class GameTrainingData(Base):
    """Datos de entrenamiento recolectados de partidas para análisis offline"""
    __tablename__ = "game_training_data"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey("game_sessions.id"), nullable=False)

    # Identificación del juego
    game_id = Column(String, nullable=False)  # pong, tictactoe, etc.

    # Datos del juego (formato optimizado para análisis)
    # Pong: [{ball_x, ball_y, ball_vx, ball_vy, paddle_y, timestamp}, ...]
    # TicTacToe: [{position, timestamp, board_state}, ...]
    moves_sequence = Column(JSON, nullable=False)

    # Estado final del juego
    final_board_state = Column(JSON)  # Estado final del tablero/cancha

    # Resultados
    player_won = Column(Boolean, nullable=False)
    player_score = Column(Integer, nullable=False)
    ai_score = Column(Integer, default=0)

    # Métricas de rendimiento
    game_duration = Column(Integer)  # Segundos
    total_moves = Column(Integer, default=0)
    critical_moments = Column(JSON, default=list)  # Momentos clave: [{event, timestamp, context}, ...]

    # Datos del jugador (para segmentación por nivel)
    player_level = Column(Integer)  # Nivel del jugador (si estaba autenticado)
    player_experience = Column(Integer)  # Experiencia total del jugador

    created_at = Column(DateTime, default=datetime.utcnow)

    # Índices
    __table_args__ = (
        Index('idx_training_game_date', 'game_id', 'created_at'),
    )

    # Relaciones
    session = relationship("GameSession", back_populates="training_data")


class AIParameterHistory(Base):
    """Historial de versiones de parámetros para rollback y análisis"""
    __tablename__ = "ai_parameter_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    game_id = Column(String, nullable=False)
    difficulty = Column(String, nullable=False)

    # Parámetros archivados (snapshot completo)
    parameters_snapshot = Column(JSON, nullable=False)
    version = Column(Integer, nullable=False)

    # Información de cambio
    change_reason = Column(String)  # "ai_trained", "manual_adjustment", "rollback"
    previous_version = Column(Integer)  # Versión anterior (para rollback)

    # Métricas antes del cambio (para comparar rendimiento)
    performance_metrics = Column(JSON)  # {win_rate, avg_score, total_games}

    created_at = Column(DateTime, default=datetime.utcnow)

    # Índices
    __table_args__ = (
        Index('idx_param_version_history', 'game_id', 'difficulty', 'version'),
    )


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
    # Games - puntos base por jugar
    'game_completed': 5,
    'game_won': 50,
    'game_lost': 10,
    # Games - puntuación por rendimiento
    'game_score_pong': 1,  # por rally
    'game_score_tictactoe': 0,
    'game_score_chinese_checkers': 0,  # Sin puntos por rendimiento
    'game_score_domino': 0,  # Sin puntos por rendimiento
    'game_score_chess': 0,  # Sin puntos por rendimiento
    'game_score_tron': 1,  # por segundo de supervivencia
    'game_score_offroad4x4': 1,  # por distancia recorrida
    'game_score_pacman': 1,  # por punto (dots + fantasmas)
    'game_score_memory': 10,  # (1000 - moves×10)
    'game_score_snake': 10,  # por manzana
    'game_score_breakout': 10,  # por bloque
    'game_score_2048': 1,  # por punto
    'game_score_tetris': 1,  # por punto
    'game_score_spaceinvaders': 10,  # por enemigo
    # Games - achievements
    'game_perfect': 100,  # juego perfecto
    'game_high_score': 75,  # mejor puntuación personal
    'game_win_2048': 200,  # alcanzar 2048
    'game_survivor': 50,  # supervivencia (Tron)
    'game_completed': 25,  # completar circuito (4x4)
    'game_collector': 40,  # coleccionar dots (Pac-Man)
    'game_hunter': 60,  # comer fantasmas (Pac-Man)
    # Prince of Persia
    'game_score_princeofpersia': 2,  # por tesoro recolectado
    'game_treasure_hunter': 50,  # recolectar todos los tesoros
    'game_level_cleared': 30,  # completar nivel
    'game_no_damage': 40,  # completar nivel sin recibir daño
    'game_guard_defeated': 15,  # por guardar derrotado
    # RTS Strategy
    'game_score_rts': 1,  # por punto de recurso
    'game_territory_conquered': 20,  # por territorio conquistado
    'game_resource_collector': 30,  # recolectar 1000+ recursos
    'game_commander': 50,  # crear 20+ unidades
    'game_victory_rts': 100,  # victoria en RTS
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