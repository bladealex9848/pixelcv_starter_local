#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de migración: SQLite → MariaDB para PixelCV
Ejecutar desde /root/pixelcv/backend con el entorno virtual activado:
    source .venv/bin/activate
    python migrate_to_mariadb.py
"""
import os
import sys
import json
from datetime import datetime
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Configuración de URLs
SQLITE_URL = "sqlite:///./pixelcv.db"
MARIADB_URL = os.getenv(
    "PIXELCV_MARIADB_URL",
    "mysql+pymysql://pixelcv_user:p2fLZ0AcyAznV7U2HxWsjBpX@localhost:3306/pixelcv_db"
)

# Importar modelos
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.models.database import Base, User, UserProfile, CV, Comment, Like, Visit, PointHistory, GameSession, PixelArt, PixelArtComment, PixelArtLike, GameAIParameters, GameTrainingData, AIParameterHistory

# Orden de migración (respetando dependencias de FK)
MIGRATION_ORDER = [
    "users",
    "user_profiles",
    "cvs",
    "comments",
    "likes",
    "visits",
    "point_history",
    "game_sessions",
    "pixel_art",
    "pixel_art_comments",
    "pixel_art_likes",
    "game_ai_parameters",
    "game_training_data",
    "ai_parameter_history",
]

# Mapeo de tabla a modelo
TABLE_MODEL_MAP = {
    "users": User,
    "user_profiles": UserProfile,
    "cvs": CV,
    "comments": Comment,
    "likes": Like,
    "visits": Visit,
    "point_history": PointHistory,
    "game_sessions": GameSession,
    "pixel_art": PixelArt,
    "pixel_art_comments": PixelArtComment,
    "pixel_art_likes": PixelArtLike,
    "game_ai_parameters": GameAIParameters,
    "game_training_data": GameTrainingData,
    "ai_parameter_history": AIParameterHistory,
}


def create_engines():
    """Crear conexiones a ambas bases de datos"""
    sqlite_engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})
    mariadb_engine = create_engine(
        MARIADB_URL,
        pool_pre_ping=True,
        pool_recycle=3600
    )
    return sqlite_engine, mariadb_engine


def create_mariadb_tables(mariadb_engine):
    """Crear todas las tablas en MariaDB"""
    print("\n[1/4] Creando tablas en MariaDB...")
    Base.metadata.create_all(bind=mariadb_engine)
    print("      Tablas creadas exitosamente.")


def get_table_count(session, table_name):
    """Obtener conteo de registros de una tabla"""
    result = session.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
    return result.scalar()


def migrate_table(sqlite_session, mariadb_session, table_name, model):
    """Migrar una tabla de SQLite a MariaDB"""
    # Obtener todos los registros de SQLite
    records = sqlite_session.query(model).all()
    count = len(records)

    if count == 0:
        print(f"      {table_name}: 0 registros (vacía)")
        return 0

    # Insertar en MariaDB
    for record in records:
        # Crear nuevo objeto con los mismos datos
        data = {}
        for column in model.__table__.columns:
            value = getattr(record, column.name)
            # Manejar campos JSON que pueden ser strings en SQLite
            if column.name in ['badges', 'design', 'game_data', 'pixels_json', 'parameters',
                               'moves_sequence', 'final_board_state', 'critical_moments',
                               'parameters_snapshot', 'performance_metrics']:
                if isinstance(value, str):
                    try:
                        value = json.loads(value)
                    except (json.JSONDecodeError, TypeError):
                        pass
            data[column.name] = value

        new_record = model(**data)
        mariadb_session.merge(new_record)  # merge permite insertar con PK existente

    mariadb_session.commit()
    print(f"      {table_name}: {count} registros migrados")
    return count


def verify_migration(sqlite_session, mariadb_session):
    """Verificar que los conteos coincidan"""
    print("\n[4/4] Verificando migración...")
    all_match = True

    for table_name in MIGRATION_ORDER:
        try:
            sqlite_count = sqlite_session.execute(text(f"SELECT COUNT(*) FROM {table_name}")).scalar()
            mariadb_count = mariadb_session.execute(text(f"SELECT COUNT(*) FROM {table_name}")).scalar()

            status = "✓" if sqlite_count == mariadb_count else "✗"
            if sqlite_count != mariadb_count:
                all_match = False

            print(f"      {status} {table_name}: SQLite={sqlite_count}, MariaDB={mariadb_count}")
        except Exception as e:
            print(f"      ✗ {table_name}: Error - {e}")
            all_match = False

    return all_match


def main():
    print("=" * 60)
    print("MIGRACIÓN DE BASE DE DATOS: SQLite → MariaDB")
    print("=" * 60)
    print(f"Origen:  {SQLITE_URL}")
    print(f"Destino: {MARIADB_URL.replace('p2fLZ0AcyAznV7U2HxWsjBpX', '****')}")

    # Crear conexiones
    sqlite_engine, mariadb_engine = create_engines()

    # Crear sesiones
    SQLiteSession = sessionmaker(bind=sqlite_engine)
    MariaDBSession = sessionmaker(bind=mariadb_engine)

    sqlite_session = SQLiteSession()
    mariadb_session = MariaDBSession()

    try:
        # Paso 1: Crear tablas en MariaDB
        create_mariadb_tables(mariadb_engine)

        # Paso 2: Verificar datos en origen
        print("\n[2/4] Verificando datos en SQLite...")
        total_records = 0
        for table_name in MIGRATION_ORDER:
            try:
                count = sqlite_session.execute(text(f"SELECT COUNT(*) FROM {table_name}")).scalar()
                total_records += count
                print(f"      {table_name}: {count} registros")
            except Exception as e:
                print(f"      {table_name}: Error - {e}")

        print(f"\n      Total: {total_records} registros a migrar")

        # Paso 3: Migrar datos
        print("\n[3/4] Migrando datos...")
        migrated_total = 0
        for table_name in MIGRATION_ORDER:
            model = TABLE_MODEL_MAP.get(table_name)
            if model:
                try:
                    count = migrate_table(sqlite_session, mariadb_session, table_name, model)
                    migrated_total += count
                except Exception as e:
                    print(f"      {table_name}: ERROR - {e}")
                    mariadb_session.rollback()

        print(f"\n      Total migrado: {migrated_total} registros")

        # Paso 4: Verificar
        success = verify_migration(sqlite_session, mariadb_session)

        print("\n" + "=" * 60)
        if success:
            print("MIGRACIÓN COMPLETADA EXITOSAMENTE")
        else:
            print("MIGRACIÓN COMPLETADA CON DIFERENCIAS")
            print("Revisa los registros que no coinciden.")
        print("=" * 60)

    except Exception as e:
        print(f"\nERROR FATAL: {e}")
        mariadb_session.rollback()
        raise
    finally:
        sqlite_session.close()
        mariadb_session.close()


if __name__ == "__main__":
    main()
