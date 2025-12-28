# Fix: Contador de CVs en Dashboard

## Problema
El contador de "CVs Creados" en el dashboard mostraba siempre 0, incluso cuando el usuario tenía CVs en su inventario.

## Causa
El problema era una inconsistencia entre el nombre del campo en el backend y el frontend:
- **Backend**: El servicio de gamificación devuelve el campo como `cvs_created`
- **Frontend**: El dashboard esperaba el campo como `total_cvs`

## Solución
Se corrigió el frontend para usar el nombre de campo correcto que devuelve la API.

### Cambios realizados

#### Frontend
**Archivo**: `frontend/app/dashboard/page.tsx`
**Línea**: 167

```typescript
// Antes
<h3 className="text-3xl font-black text-cyan-400">{stats?.total_cvs || 0}</h3>

// Después
<h3 className="text-3xl font-black text-cyan-400">{stats?.cvs_created || 0}</h3>
```

## Verificación
El campo `cvs_created` se actualiza correctamente en el backend cuando:
1. Un usuario crea un nuevo CV (en `backend/app/api/routes_cv.py` línea 102)
2. Un usuario publica un CV (en `backend/app/api/routes_cv_community.py` línea 61)

## API Reference
El endpoint `/gamification/stats/me` devuelve un objeto con la siguiente estructura relevante:

```json
{
  "level": 1,
  "rank_title": "Novato",
  "total_points": 0,
  "experience": 0,
  "progress_to_next_level": 0.0,
  "cvs_created": 1,  // Campo corregido
  "cvs_published": 0,
  "total_visits_received": 0,
  "total_likes_given": 0,
  "total_likes_received": 0,
  "total_comments": 0,
  "badges": [],
  "next_level_points": 100
}
```

## Impacto
- Los usuarios ahora verán correctamente el número de CVs que han creado
- El contador se actualizará en tiempo real cuando se creen nuevos CVs
- La consistencia entre frontend y backend se ha restaurado