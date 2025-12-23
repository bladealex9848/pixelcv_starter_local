# -*- coding: utf-8 -*-
"""Servicio de Gamificación - Sistema de puntos, niveles y badges"""
from sqlalchemy.orm import Session
from app.models.database import User, UserProfile, CV, PointHistory, Visit, Comment, Like
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