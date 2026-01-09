# Migración de Base de Datos: SQLite a MariaDB

**Fecha**: 2026-01-09
**Estado**: Completado
**Autor**: Claude Code (Asistente IA)

---

## Resumen Ejecutivo

Se realizó la migración completa de la base de datos de PixelCV desde SQLite (archivo local) a MariaDB (servidor de producción). La migración incluyó 358 registros distribuidos en 14 tablas, sin pérdida de datos.

## Motivación

| Aspecto | SQLite | MariaDB |
|---------|--------|---------|
| Concurrencia | Un escritor a la vez | Múltiples conexiones simultáneas |
| Escalabilidad | Limitada | Alta (horizontal y vertical) |
| Backup | Copia de archivo | Incremental, punto en tiempo |
| Replicación | No soportada | Master-Slave configurado |
| Rendimiento bajo carga | Bloqueo de tabla completa | Bloqueo por fila |

## Configuración del Servidor MariaDB

```
Servidor: MariaDB 11.8.2-ubu2404-log
Puerto: 3306
Base de datos: pixelcv_db
Usuario: pixelcv_user
Charset: utf8mb4
Collation: utf8mb4_unicode_ci
```

## Cambios Realizados

### 1. Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `backend/app/models/database.py` | Soporte dual SQLite/MariaDB con pool de conexiones |
| `backend/.env` | URL de conexión actualizada a MariaDB |
| `backend/pyproject.toml` | Dependencia `pymysql` agregada |

### 2. Código de Conexión (database.py)

```python
DATABASE_URL = os.getenv("PIXELCV_DB_URL", "sqlite:///./pixelcv.db")

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,      # Verifica conexión antes de usarla
        pool_recycle=3600,       # Recicla conexiones cada hora
        pool_size=10,            # Conexiones permanentes en el pool
        max_overflow=20,         # Conexiones adicionales bajo demanda
    )
```

### 3. Tipos de Datos Ajustados

Los campos `String` sin longitud se actualizaron para compatibilidad con MySQL/MariaDB:

- `String` → `String(36)` para UUIDs
- `String` → `String(100-255)` para campos de texto corto
- `String` → `Text` para campos que pueden contener datos largos (ej: avatar_url con base64)

## Datos Migrados

| Tabla | Registros |
|-------|-----------|
| users | 43 |
| user_profiles | 43 |
| cvs | 2 |
| comments | 0 |
| likes | 1 |
| visits | 22 |
| point_history | 160 |
| game_sessions | 45 |
| pixel_art | 5 |
| pixel_art_comments | 0 |
| pixel_art_likes | 5 |
| game_ai_parameters | 0 |
| game_training_data | 32 |
| ai_parameter_history | 0 |
| **Total** | **358** |

## Script de Migración

Se creó `backend/migrate_to_mariadb.py` para:
1. Crear tablas en MariaDB usando los modelos SQLAlchemy
2. Leer datos de SQLite tabla por tabla
3. Insertar en MariaDB preservando relaciones FK
4. Verificar integridad de datos post-migración

## Verificación Post-Migración

### Pruebas Realizadas

1. **API de Autenticación**: Login exitoso con usuario existente
2. **Creación de CV**: CV creado y guardado correctamente
3. **Publicación de CV**: Puntos de gamificación actualizados (+60 pts)
4. **Leaderboard**: Datos correctos desde MariaDB
5. **CV Público**: Accesible vía slug

### Resultados de Prueba

```
Usuario: bladealex
- Puntos antes: 315
- Puntos después: 385 (+70 por crear y publicar CV)
- CVs creados: 2
- CVs publicados: 1
- CV público: https://pixelcv.alexanderoviedofadul.dev/cv/alexander-oviedo-fadul-1526c884
```

## Backup

El archivo SQLite original se preservó en:
```
/root/pixelcv/backend/pixelcv_backup_20260109_*.db
```

## Notas Importantes

1. **read_only**: El servidor MariaDB tenía `read_only=ON` (configuración de slave). Se desactivó para permitir escrituras.

2. **Pool de conexiones**: Configurado para producción con:
   - 10 conexiones permanentes
   - 20 conexiones adicionales bajo demanda
   - Reciclaje cada hora para evitar timeouts

3. **Compatibilidad**: El código mantiene compatibilidad con SQLite para desarrollo local.

## Referencias

- Documentación MariaDB: `/root/docs/05-infraestructura/MARIADB_IMPLEMENTATION.md`
- Replicación: `/root/docs/05-infraestructura/DOCUMENTACION-REPLICACION-MARIADB.md`
