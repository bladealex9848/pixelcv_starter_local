# -*- coding: utf-8 -*-
"""Servicio de Gamificación - Sistema de puntos, niveles y badges"""
from sqlalchemy.orm import Session
from app.models.database import User, UserProfile, CV, PointHistory, Visit, Comment, Like, GameSession
from app.models.database import LEVEL_THRESHOLDS, POINT_VALUES, BADGES
from datetime import datetime, timedelta
from typing import Optional, List


class GamificationService:
    """Servicio para manejar toda la lógica de gamificación"""
    
    @staticmethod
    def add_points(
        db: Session,
        user_id: str,
        action: str,
        description: str = None,
        related_cv_id: str = None
    ) -> UserProfile:
        """
        Agrega puntos a un usuario y actualiza su perfil
        """
        points = POINT_VALUES.get(action, 0)
        if points == 0:
            return db.query(UserProfile).filter_by(user_id=user_id).first()
        
        profile = db.query(UserProfile).filter_by(user_id=user_id).first()
        if not profile:
            profile = UserProfile(user_id=user_id)
            db.add(profile)
            db.flush()
        
        history = PointHistory(
            user_id=user_id,
            user_profile_id=profile.user_id,
            points=points,
            action=action,
            description=description or f"Puntos por {action}",
            related_cv_id=related_cv_id
        )
        db.add(history)
        
        profile.total_points += points
        profile.experience += points
        
        new_level = GamificationService.calculate_level(profile.experience)
        if new_level != profile.level:
            profile.level = new_level
            profile.rank_title = GamificationService.get_rank_title(new_level)
            if new_level == 5:
                GamificationService.add_badge(db, profile, 'legend')
        
        GamificationService.check_badges(db, profile, action)
        
        db.commit()
        db.refresh(profile)
        return profile
    
    @staticmethod
    def calculate_level(experience: int) -> int:
        level = 1
        for lvl, threshold in LEVEL_THRESHOLDS.items():
            if experience >= threshold:
                level = lvl
        return level
    
    @staticmethod
    def get_rank_title(level: int) -> str:
        titles = {1: "Novato", 2: "Aprendiz", 3: "Maestro", 4: "Experto", 5: "Leyenda"}
        return titles.get(level, "Novato")
    
    @staticmethod
    def add_badge(db: Session, profile: UserProfile, badge_key: str) -> bool:
        if not profile.badges:
            profile.badges = []
        
        if badge_key not in profile.badges:
            profile.badges.append(badge_key)
            history = PointHistory(
                user_id=profile.user_id,
                user_profile_id=profile.user_id,
                points=POINT_VALUES['badge_earned'],
                action='badge_earned',
                description=f"¡Ganaste el badge: {BADGES[badge_key]['name']}"
            )
            db.add(history)
            profile.total_points += POINT_VALUES['badge_earned']
            profile.experience += POINT_VALUES['badge_earned']
            db.commit()
            return True
        return False
    
    @staticmethod
    def check_badges(db: Session, profile: UserProfile, action: str):
        badges_to_check = []
        if profile.cvs_published >= 10:
            badges_to_check.append('top_creator')
        if profile.total_comments >= 50:
            badges_to_check.append('social_butterfly')
        if profile.total_likes_received >= 100:
            badges_to_check.append('popular')
        
        for badge_key in badges_to_check:
            GamificationService.add_badge(db, profile, badge_key)
    
    @staticmethod
    def record_visit(
        db: Session,
        cv_id: str,
        visitor_ip: str,
        visitor_user_agent: str = None,
        visitor_id: str = None,
        referrer: str = None
    ) -> tuple:
        one_hour_ago = datetime.utcnow() - timedelta(hours=1)
        recent_visit = db.query(Visit).filter(
            Visit.cv_id == cv_id,
            Visit.visitor_ip == visitor_ip,
            Visit.created_at >= one_hour_ago
        ).first()
        
        if recent_visit:
            cv = db.query(CV).filter_by(id=cv_id).first()
            return cv, None
        
        visit = Visit(
            cv_id=cv_id,
            visitor_id=visitor_id,
            visitor_ip=visitor_ip,
            visitor_user_agent=visitor_user_agent,
            referrer=referrer
        )
        db.add(visit)
        
        cv = db.query(CV).filter_by(id=cv_id).first()
        if cv:
            cv.total_visits += 1
        
        profile = GamificationService.add_points(
            db=db,
            user_id=cv.user_id,
            action='visit_received',
            description="Tu CV recibió una visita",
            related_cv_id=cv_id
        )
        
        if profile:
            profile.total_visits_received += 1
            if cv.total_visits >= 1000:
                GamificationService.add_badge(db, profile, 'viral')
        
        db.commit()
        return cv, profile
    
    @staticmethod
    def toggle_like(db: Session, cv_id: str, user_id: str) -> tuple:
        cv = db.query(CV).filter_by(id=cv_id).first()
        if not cv:
            return None, None
        
        existing_like = db.query(Like).filter(
            Like.cv_id == cv_id,
            Like.user_id == user_id
        ).first()
        
        if existing_like:
            db.delete(existing_like)
            cv.total_likes -= 1
            owner_profile = db.query(UserProfile).filter_by(user_id=cv.user_id).first()
            if owner_profile and owner_profile.total_likes_received > 0:
                owner_profile.total_likes_received -= 1
                owner_profile.total_points -= POINT_VALUES['like_received']
                owner_profile.experience -= POINT_VALUES['like_received']
        else:
            new_like = Like(cv_id=cv_id, user_id=user_id)
            db.add(new_like)
            cv.total_likes += 1
            owner_profile = GamificationService.add_points(
                db=db,
                user_id=cv.user_id,
                action='like_received',
                description="Tu CV recibió un like",
                related_cv_id=cv_id
            )
            liker_profile = GamificationService.add_points(
                db=db,
                user_id=user_id,
                action='like_given',
                description="Diste un like"
            )
            if owner_profile and owner_profile.total_likes_received >= 100:
                GamificationService.add_badge(db, owner_profile, 'popular')
        
        db.commit()
        return cv, owner_profile if owner_profile else None
    
    @staticmethod
    def add_comment(
        db: Session,
        cv_id: str,
        user_id: str,
        content: str,
        parent_id: str = None
    ) -> tuple:
        cv = db.query(CV).filter_by(id=cv_id).first()
        if not cv:
            return None, None
        
        comment = Comment(
            id=str(datetime.utcnow().timestamp()),
            cv_id=cv_id,
            user_id=user_id,
            content=content,
            parent_id=parent_id
        )
        db.add(comment)
        cv.total_comments += 1
        
        commenter_profile = GamificationService.add_points(
            db=db,
            user_id=user_id,
            action='comment_posted',
            description="Comentaste en un CV",
            related_cv_id=cv_id
        )
        commenter_profile.total_comments += 1
        
        owner_profile = GamificationService.add_points(
            db=db,
            user_id=cv.user_id,
            action='comment_received',
            description="Tu CV recibió un comentario",
            related_cv_id=cv_id
        )
        
        if commenter_profile.total_comments >= 50:
            GamificationService.add_badge(db, commenter_profile, 'social_butterfly')
        
        db.commit()
        db.refresh(comment)
        return comment, owner_profile
    
    @staticmethod
    def get_leaderboard(db: Session, limit: int = 100) -> List[dict]:
        query = db.query(User, UserProfile).join(UserProfile).filter(
            UserProfile.total_points > 0
        ).order_by(UserProfile.total_points.desc()).limit(limit)
        
        results = []
        for user, profile in query.all():
            results.append({
                'user_id': user.id,
                'username': user.username,
                'full_name': user.full_name,
                'avatar_url': user.avatar_url,
                'level': profile.level,
                'rank_title': profile.rank_title,
                'total_points': profile.total_points,
                'cvs_published': profile.cvs_published,
                'badges': profile.badges or []
            })
        
        return results
    
    @staticmethod
    def get_user_stats(db: Session, user_id: str) -> dict:
        profile = db.query(UserProfile).filter_by(user_id=user_id).first()
        if not profile:
            return {}
        
        current_level = profile.level
        if current_level < 5:
            current_threshold = LEVEL_THRESHOLDS[current_level]
            next_threshold = LEVEL_THRESHOLDS[current_level + 1]
            progress = min(100, ((profile.experience - current_threshold) / (next_threshold - current_threshold)) * 100)
        else:
            progress = 100
        
        badges_info = []
        if profile.badges:
            for badge_key in profile.badges:
                badge_data = BADGES.get(badge_key, {})
                badges_info.append({
                    'key': badge_key,
                    'name': badge_data.get('name', ''),
                    'description': badge_data.get('description', ''),
                    'icon': badge_data.get('icon', '🏅')
                })
        
        return {
            'level': profile.level,
            'rank_title': profile.rank_title,
            'total_points': profile.total_points,
            'experience': profile.experience,
            'progress_to_next_level': round(progress, 1),
            'cvs_created': profile.cvs_created,
            'cvs_published': profile.cvs_published,
            'total_visits_received': profile.total_visits_received,
            'total_likes_given': profile.total_likes_given,
            'total_likes_received': profile.total_likes_received,
            'total_comments': profile.total_comments,
            'badges': badges_info,
            'next_level_points': LEVEL_THRESHOLDS.get(current_level + 1, LEVEL_THRESHOLDS[5])
        }

    @staticmethod
    def record_game_session(
        db: Session,
        user_id: Optional[str],
        game_id: str,
        score: int,
        won: bool = False,
        moves: int = 0,
        time_seconds: int = 0,
        game_data: dict = None
    ) -> GameSession:
        """
        Registra una sesión de juego y calcula los puntos ganados.

        Si user_id es None, es un juego de demo (sin puntos).
        """
        # Crear sesión de juego
        session = GameSession(
            user_id=user_id,
            game_id=game_id,
            score=score,
            won=won,
            moves=moves,
            time_seconds=time_seconds,
            game_data=game_data or {}
        )

        # Solo calcular puntos si hay usuario registrado
        if user_id:
            points = GamificationService._calculate_game_points(
                game_id=game_id,
                score=score,
                won=won,
                moves=moves,
                game_data=game_data or {}
            )
            session.points_earned = points

            # Agregar puntos al usuario
            GamificationService.add_points(
                db=db,
                user_id=user_id,
                action='game_completed',
                description=f"Jugaste {game_id} - Score: {score}",
            )

            # Puntos por victoria/derrota
            if won:
                GamificationService.add_points(
                    db=db,
                    user_id=user_id,
                    action='game_won',
                    description=f"Ganaste en {game_id}",
                )
            else:
                GamificationService.add_points(
                    db=db,
                    user_id=user_id,
                    action='game_lost',
                    description=f"Perdiste en {game_id}",
                )

            # Puntos por rendimiento
            score_points = GamificationService._calculate_score_points(
                game_id=game_id,
                score=score,
                moves=moves,
                game_data=game_data or {}
            )
            if score_points > 0:
                GamificationService.add_points(
                    db=db,
                    user_id=user_id,
                    action=f'game_score_{game_id}',
                    description=f"Rendimiento en {game_id}: +{score_points} puntos",
                )

            # Verificar achievements
            achievements = GamificationService._check_game_achievements(
                db=db,
                user_id=user_id,
                game_id=game_id,
                score=score,
                won=won,
                moves=moves,
                game_data=game_data or {}
            )
            for achievement in achievements:
                GamificationService.add_points(
                    db=db,
                    user_id=user_id,
                    action=achievement['action'],
                    description=achievement['description'],
                )

        db.add(session)
        db.commit()
        db.refresh(session)
        return session

    @staticmethod
    def _calculate_game_points(
        game_id: str,
        score: int,
        won: bool,
        moves: int,
        game_data: dict
    ) -> int:
        """Calcula los puntos base por jugar un juego."""
        points = 0

        # Puntos base
        points += POINT_VALUES.get('game_completed', 0)

        # Puntos por resultado
        if won:
            points += POINT_VALUES.get('game_won', 0)
        else:
            points += POINT_VALUES.get('game_lost', 0)

        return points

    @staticmethod
    def _calculate_score_points(
        game_id: str,
        score: int,
        moves: int,
        game_data: dict
    ) -> int:
        """Calcula puntos por rendimiento según el juego."""
        game_point_key = f'game_score_{game_id}'
        base_point = POINT_VALUES.get(game_point_key, 0)

        if game_id == 'pong':
            # 1 punto por rally
            return score * base_point
        elif game_id == 'tictactoe':
            # Sin puntos por rendimiento
            return 0
        elif game_id == 'memory':
            # 1000 - (moves × 10), mínimo 0
            return max(0, min(1000, (1000 - moves * 10))) * base_point // 10
        elif game_id == 'snake':
            # 10 puntos por manzana
            return score * base_point
        elif game_id == 'breakout':
            # 10 puntos por bloque
            return score * base_point
        elif game_id == '2048':
            # 1 punto por punto de score
            return score * base_point
        elif game_id == 'tetris':
            # 1 punto por punto de score
            return score * base_point
        elif game_id == 'spaceinvaders':
            # 10 puntos por enemigo
            return score * base_point
        else:
            return 0

    @staticmethod
    def _check_game_achievements(
        db: Session,
        user_id: str,
        game_id: str,
        score: int,
        won: bool,
        moves: int,
        game_data: dict
    ) -> List[dict]:
        """Verifica achievements desbloqueados en el juego."""
        achievements = []

        # Buscar mejor puntuación anterior del usuario en este juego
        best_score = db.query(GameSession).filter(
            GameSession.user_id == user_id,
            GameSession.game_id == game_id
        ).order_by(GameSession.score.desc()).first()

        previous_best = best_score.score if best_score else 0

        if game_id == 'pong':
            # Perfect: ganar sin recibir puntos (game_data['opponent_score'] == 0)
            if won and game_data.get('opponent_score', 1) == 0:
                achievements.append({
                    'action': 'game_perfect',
                    'description': '¡Perfecto en Pong! No recibiste puntos'
                })
            # High score
            elif score > previous_best:
                achievements.append({
                    'action': 'game_high_score',
                    'description': f'¡Nueva mejor puntuación en Pong: {score}!'
                })

        elif game_id == 'tictactoe':
            # Perfect: ganar en menos de 5 movimientos
            if won and moves <= 5:
                achievements.append({
                    'action': 'game_perfect',
                    'description': '¡Victoria rápida en Tic Tac Toe!'
                })

        elif game_id == 'memory':
            # Perfect: completar en 12 o menos movimientos
            if moves <= 12:
                achievements.append({
                    'action': 'game_perfect',
                    'description': '¡Memoria perfecta! Completado en ≤12 movimientos'
                })
            elif score > previous_best:
                achievements.append({
                    'action': 'game_high_score',
                    'description': f'¡Mejor puntuación en Memory: {score}!'
                })

        elif game_id == 'snake':
            # High score
            if score > previous_best:
                achievements.append({
                    'action': 'game_high_score',
                    'description': f'¡Nuevo récord en Snake: {score} manzanas!'
                })

        elif game_id == 'breakout':
            # Perfect: destruir todos los bloques
            if game_data.get('blocks_destroyed', 0) >= game_data.get('total_blocks', 999):
                achievements.append({
                    'action': 'game_perfect',
                    'description': '¡Breakout perfecto! Destruiste todos los bloques'
                })
            elif score > previous_best:
                achievements.append({
                    'action': 'game_high_score',
                    'description': f'¡Mejor puntuación en Breakout: {score}!'
                })

        elif game_id == '2048':
            # Win: alcanzar el tile 2048
            max_tile = game_data.get('max_tile', 0)
            if max_tile >= 2048:
                achievements.append({
                    'action': 'game_win_2048',
                    'description': '¡Alcanzaste el 2048!'
                })
            elif score > previous_best:
                achievements.append({
                    'action': 'game_high_score',
                    'description': f'¡Mejor puntuación en 2048: {score}!'
                })

        elif game_id == 'tetris':
            # High score
            if score > previous_best:
                achievements.append({
                    'action': 'game_high_score',
                    'description': f'¡Nuevo récord en Tetris: {score}!'
                })

        elif game_id == 'spaceinvaders':
            # Perfect: eliminar todos los enemigos
            if game_data.get('enemies_destroyed', 0) >= game_data.get('total_enemies', 999):
                achievements.append({
                    'action': 'game_perfect',
                    'description': '¡Space Invaders perfecto! Eliminaste todos los enemigos'
                })
            elif score > previous_best:
                achievements.append({
                    'action': 'game_high_score',
                    'description': f'¡Mejor puntuación en Space Invaders: {score}!'
                })

        return achievements

    @staticmethod
    def get_game_leaderboard(db: Session, game_id: str, limit: int = 50) -> List[dict]:
        """
        Obtiene el ranking de un juego específico.
        Solo incluye usuarios registrados (user_id not null).
        """
        query = db.query(User, UserProfile, GameSession).join(
            UserProfile, User.id == UserProfile.user_id
        ).join(
            GameSession, User.id == GameSession.user_id
        ).filter(
            GameSession.game_id == game_id,
            GameSession.user_id.isnot(None)
        ).order_by(GameSession.score.desc()).limit(limit)

        results = []
        for user, profile, session in query.all():
            results.append({
                'user_id': user.id,
                'username': user.username,
                'avatar_url': user.avatar_url,
                'level': profile.level,
                'rank_title': profile.rank_title,
                'score': session.score,
                'won': session.won,
                'moves': session.moves,
                'time_seconds': session.time_seconds,
                'created_at': session.created_at.isoformat()
            })

        return results

    @staticmethod
    def get_games_list() -> List[dict]:
        """Retorna la lista de juegos disponibles con sus configuraciones."""
        return [
            {
                'id': 'pong',
                'name': 'Pong',
                'description': 'El clásico juego de ping pong arcade',
                'icon': '🏓',
                'category': 'Arcade',
                'has_ai': True,
                'multiplayer': False
            },
            {
                'id': 'tictactoe',
                'name': 'Tic Tac Toe',
                'description': 'El clásico juego de 3 en raya contra la IA',
                'icon': '⭕',
                'category': 'Estrategia',
                'has_ai': True,
                'multiplayer': False
            },
            {
                'id': 'memory',
                'name': 'Memory Match',
                'description': 'Encuentra las parejas de cartas',
                'icon': '🃏',
                'category': 'Puzzle',
                'has_ai': False,
                'multiplayer': False
            },
            {
                'id': 'snake',
                'name': 'Snake',
                'description': 'El clásico juego de la serpiente',
                'icon': '🐍',
                'category': 'Arcade',
                'has_ai': False,
                'multiplayer': False
            },
            {
                'id': 'breakout',
                'name': 'Breakout',
                'description': 'Destruye los bloques con la pelota',
                'icon': '🧱',
                'category': 'Arcade',
                'has_ai': False,
                'multiplayer': False
            },
            {
                'id': '2048',
                'name': '2048',
                'description': 'Combina números para llegar a 2048',
                'icon': '🔢',
                'category': 'Puzzle',
                'has_ai': False,
                'multiplayer': False
            },
            {
                'id': 'tetris',
                'name': 'Tetris',
                'description': 'El clásico juego de bloques',
                'icon': '🧩',
                'category': 'Arcade',
                'has_ai': False,
                'multiplayer': False
            },
            {
                'id': 'spaceinvaders',
                'name': 'Space Invaders',
                'description': 'Defiende la Tierra de los invasores',
                'icon': '👾',
                'category': 'Arcade',
                'has_ai': True,
                'multiplayer': False
            },
        ]