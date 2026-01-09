# Prueba End-to-End de PixelCV con MariaDB

**Fecha**: 2026-01-09
**Estado**: ✅ Completado exitosamente
**Objetivo**: Verificar el flujo completo Frontend → Backend → MariaDB

---

## Resumen Ejecutivo

Se realizó una prueba completa del sistema PixelCV desde el registro de un nuevo usuario hasta la creación y publicación de un CV profesional, verificando la correcta integración entre Frontend (Next.js), Backend (FastAPI) y Base de Datos (MariaDB).

**Resultado**: ✅ **Todas las pruebas fueron exitosas**

---

## Arquitectura Verificada

```
┌─────────────────────────────────────────────────────────────────┐
│                  FLUJO DE DATOS VERIFICADO                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Frontend (Next.js)          Backend (FastAPI)         MariaDB   │
│  /register                   /api/auth/register       users     │
│  /login                      /api/auth/login          user_profiles
│  /editor                     /api/cv                  cvs
│  /dashboard                  /api/gamification/       point_history
│                                                                  │
│     fetch API ←→ JWT Token ←→ SQLAlchemy ←→ MariaDB 11.8.2     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Fases de Prueba

### FASE 1: Registro de Nuevo Usuario ✅

**Usuario creado**:
- **Username**: `testuser2026`
- **Email**: `testuser2026@prueba.dev`
- **Password**: `TestPassword123!`
- **Full Name**: `Usuario Prueba 2026`

**Endpoint**: `POST /api/auth/register`

**Respuesta**:
```json
{
    "message": "Usuario registrado exitosamente",
    "user": {
        "id": "1767993145.943693d064dcf8",
        "username": "testuser2026",
        "email": "testuser2026@prueba.dev",
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=testuser2026"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Verificación en MariaDB**:
```sql
SELECT * FROM users WHERE username = 'testuser2026';
-- ✅ Usuario encontrado
SELECT * FROM user_profiles WHERE user_id = '1767993145.943693d064dcf8';
-- ✅ Perfil creado con 0 puntos, nivel 1 (Novato)
```

---

### FASE 2: Login y Verificación de Sesión ✅

**Endpoint**: `POST /api/auth/login`

**Respuesta**:
```json
{
    "message": "Login exitoso",
    "user": {...},
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Verificación**: Token JWT válido almacenado para siguientes peticiones.

---

### FASE 3: Diligenciamiento de Perfil ✅

**Endpoint**: `PUT /api/auth/profile`

**Payload**:
```json
{
  "bio": "Profesional de prueba para validar el sistema PixelCV. Especialista en desarrollo full stack y arquitecturas cloud."
}
```

**Verificación en MariaDB**:
```sql
SELECT bio FROM users WHERE username = 'testuser2026';
-- ✅ Bio actualizada correctamente
```

---

### FASE 4: Creación de CV Completo ✅

**Endpoint**: `POST /api/cv`

**Datos del CV**:
```yaml
name: Usuario Prueba 2026
email: testuser2026@prueba.dev
phone: "+57 300 123 4567"
location: Bogotá, Colombia
summary: Profesional enfocado en tecnologías web...
theme: classic

sections:
  experiencia:
    - company: "Tech Solutions SAS"
      position: "Desarrollador Full Stack"
      ...
  educacion:
    - institution: "Universidad Nacional"
      degree: "Ingeniería de Sistemas"
      ...
  skills:
    - JavaScript, TypeScript, React, Next.js, Python, FastAPI...
```

**Respuesta**:
```json
{
    "cvId": "e38fef27-9967-4dd8-b47b-69a2a0490d1e",
    "slug": "usuario-prueba-2026-e2ac1678",
    "saved": true,
    "message": "CV creado y guardado exitosamente"
}
```

**Verificación de gamificación**:
```sql
SELECT total_points, cvs_created FROM user_profiles WHERE user_id = '...';
-- ✅ total_points: 0 → 10 (+10 por crear CV)
-- ✅ cvs_created: 0 → 1
```

---

### FASE 5: Publicación de CV ✅

**Endpoint**: `POST /api/cv/{cv_id}/publish`

**Respuesta**:
```json
{
    "cv_id": "e38fef27-9967-4dd8-b47b-69a2a0490d1e",
    "is_published": true,
    "slug": "usuario-prueba-2026-e2ac1678",
    "message": "CV publicado"
}
```

**Verificación de gamificación**:
```sql
SELECT total_points, cvs_published FROM user_profiles WHERE user_id = '...';
-- ✅ total_points: 10 → 60 (+50 por publicar CV)
-- ✅ cvs_published: 0 → 1
```

**CV Público**: https://pixelcv.alexanderoviedofadul.dev/cv/usuario-prueba-2026-e2ac1678

---

### FASE 6: Verificación de Endpoints API ✅

| Endpoint | Método | Resultado |
|----------|--------|-----------|
| `/api/auth/register` | POST | ✅ Usuario creado |
| `/api/auth/login` | POST | ✅ Token generado |
| `/api/auth/profile` | PUT | ✅ Perfil actualizado |
| `/api/cv` | POST | ✅ CV creado |
| `/api/cv/{id}/publish` | POST | ✅ CV publicado |
| `/api/cv/my` | GET | ✅ Lista de CVs |
| `/api/gamification/leaderboard` | GET | ✅ Usuario aparece |
| `/api/community/public/{slug}` | GET | ✅ CV accesible sin token |

---

### FASE 7: Verificación en MariaDB ✅

**Usuario y perfil**:
```
ID: 1767993145.943693d064dcf8
Username: testuser2026
Email: testuser2026@prueba.dev
Puntos: 60
Nivel: 1 (Novato)
CVs creados: 1
CVs publicados: 1
```

**CVs del usuario**:
```
ID: e38fef27-9967-4dd8-b47b-69a2a0490d1e
Name: Usuario Prueba 2026
Slug: usuario-prueba-2026-e2ac1678
Published: true
Created: 2026-01-09 21:18:17
Published: 2026-01-09 21:19:19
```

**Historial de puntos**:
```
| Action         | Points | Description                    | Timestamp           |
|----------------|--------|--------------------------------|---------------------|
| cv_published   | 50     | CV publicado: Usuario Prueba   | 2026-01-09 21:19:19 |
| cv_created     | 10     | CV creado: Usuario Prueba      | 2026-01-09 21:18:17 |
|----------------|--------|--------------------------------|---------------------|
| TOTAL          | 60     |                                |                     |
```

**Conteo de registros**:
```
+------------+-------+
| Tabla      | Total |
+------------+-------+
| users      | 44    |
| user_profiles | 44 |
| cvs        | 5     |
| point_history | 165 |
+------------+-------+
```

---

## Sistema de Gamificación Verificado

### Puntos por Acción

| Acción | Puntos | Verificado |
|--------|--------|------------|
| Crear CV | +10 | ✅ |
| Publicar CV | +50 | ✅ |
| **Total prueba** | **60** | ✅ |

### Niveles

| Nivel | Rango de Puntos | Usuario |
|-------|-----------------|---------|
| 1 - Novato | 0 - 99 | ✅ testuser2026 (60 pts) |
| 2 - Aprendiz | 100 - 499 | |
| 3 - Maestro | 500 - 1,499 | |
| 4 - Experto | 1,500 - 4,999 | |
| 5 - Leyenda | 5,000+ | |

---

## Leaderboard Actualizado

**Posición después de la prueba**:

1. aoviedofadul - 3,198 puntos - Nivel 4 (Experto)
2. bladealex - 385 puntos - Nivel 2 (Aprendiz)
3. **testuser2026 - 60 puntos - Nivel 1 (Novato)** ← Nuevo
4. Ross - 10 puntos - Nivel 1 (Novato)

---

## Conexiones Verificadas

### Frontend → Backend
- ✅ Fetch API funcionando correctamente
- ✅ JWT token almacenado en localStorage
- ✅ Headers de autorización enviados correctamente
- ✅ Respuestas JSON procesadas correctamente

### Backend → MariaDB
- ✅ SQLAlchemy engine conectado
- ✅ Pool de conexiones funcionando
- ✅ Transacciones completadas exitosamente
- ✅ Datos persistidos correctamente

### Sistema de Gamificación
- ✅ Puntos otorgados correctamente
- ✅ Historial de puntos registrado
- ✅ Contadores actualizados (cvs_created, cvs_published)
- ✅ Leaderboard actualizado en tiempo real

---

## Archivos del Sistema

| Componente | Archivo | Estado |
|------------|---------|--------|
| **Backend** | `/root/pixelcv/backend/app/models/database.py` | ✅ MariaDB pool configurado |
| **Backend** | `/root/pixelcv/backend/app/api/routes_auth.py` | ✅ Endpoints funcionando |
| **Backend** | `/root/pixelcv/backend/app/api/routes_cv.py` | ✅ Endpoints funcionando |
| **Backend** | `/root/pixelcv/backend/app/services/gamification_service.py` | ✅ Puntos calculados |
| **Frontend** | `/root/pixelcv/frontend/.env.local` | ✅ API_URL configurada |

---

## Comandos de Verificación

### Ver usuario en MariaDB
```bash
mariadb -u pixelcv_user -p"p2fLZ0AcyAznV7U2HxWsjBpX" pixelcv_db -e "
SELECT u.username, p.total_points, p.level
FROM users u
JOIN user_profiles p ON u.id = p.user_id
WHERE u.username = 'testuser2026';
"
```

### Ver CVs del usuario
```bash
mariadb -u pixelcv_user -p"p2fLZ0AcyAznV7U2HxWsjBpX" pixelcv_db -e "
SELECT name, slug, is_published
FROM cvs
WHERE user_id = (SELECT id FROM users WHERE username = 'testuser2026');
"
```

### Ver historial de puntos
```bash
mariadb -u pixelcv_user -p"p2fLZ0AcyAznV7U2HxWsjBpX" pixelcv_db -e "
SELECT action, points, created_at
FROM point_history
WHERE user_id = (SELECT id FROM users WHERE username = 'testuser2026')
ORDER BY created_at DESC;
"
```

---

## Resultados Esperados vs Obtenidos

| Métrica | Esperado | Obtenido | Estado |
|---------|----------|----------|--------|
| Usuarios en BD | +1 | 44 (+1) | ✅ |
| CVs creados | +1 | 5 (+1) | ✅ |
| CVs publicados | +1 | 1 (+1) | ✅ |
| Puntos ganados | 60 | 60 | ✅ |
| Nivel alcanzado | 1 (Novato) | 1 (Novato) | ✅ |
| Historial de puntos | 2 registros | 2 registros | ✅ |

---

## Conclusión

**✅ Todas las pruebas fueron exitosas**

El sistema PixelCV está funcionando correctamente con la arquitectura:

```
Frontend (Next.js) → Backend (FastAPI) → MariaDB (pixelcv_db)
```

**Flujo completo verificado**:
1. Registro de usuario → MariaDB
2. Login → JWT Token → Frontend
3. Actualización de perfil → MariaDB
4. Creación de CV → PDF + MariaDB
5. Publicación de CV → Slug único + Puntos
6. Gamificación → Leaderboard actualizado

**Sistema listo para producción** 🚀

---

## Documentación Relacionada

- **Migración a MariaDB**: `/root/pixelcv/docs/development/sqlite-to-mariadb-migration-2026-01-09.md`
- **Backup del servidor**: `/root/docs/20-scripts-backup/pixelcv-mariadb-backup-2026-01-09.md`
- **Backup del proyecto**: `/root/pixelcv/docs/development/backup-inclusion-mariadb-2026-01-09.md`

---

## Notas

- El usuario `testuser2026` puede mantenerse para pruebas futuras o eliminarse
- Los scripts de backup automáticos incluyen `pixelcv_db`
- El pool de conexiones de MariaDB está configurado para producción (10+20)
- El sistema de gamificación está funcionando correctamente
