# PixelCV - Sistema de Backup en Producción

**Fecha**: 2026-01-09
**Autor**: Claude (bladealex9848/pixelcv_starter_local)
**Estado**: ✅ Activo y validado

---

## Resumen Ejecutivo

Como parte de la migración de SQLite a MariaDB completada el 2026-01-09, PixelCV (`pixelcv_db`) ha sido **automáticamente integrado** en el sistema de backups automatizados del servidor de producción.

`★ Insight ─────────────────────────────────────`
**Ventaja clave**: Al migrar a MariaDB, PixelCV hereda automáticamente el sistema de backup empresarial del servidor:
- **Backup diario** sin configuración adicional
- **Retención de 7 días** con limpieza automática
- **Compresión gzip** para ahorrar espacio
- **Symlinks** de "latest" para restauración rápida
`─────────────────────────────────────────────────`

---

## Configuración del Backup

| Parámetro | Valor |
|-----------|-------|
| **Script** | `/root/scripts/backup-databases-ftp-individual.sh` |
| **Cron** | `0 2 * * *` (Diariamente a las 02:00 AM) |
| **Base de datos** | `pixelcv_db` (MariaDB 11.8.2) |
| **Directorio** | `/home/backup-db/databases/` |
| **Log** | `/home/backup-db/logs/` |
| **Retención** | 7 días (automático) |

---

## Validación Exitosa

### Prueba Ejecutada (2026-01-09 20:58 UTC)

```bash
$ bash /root/scripts/backup-databases-ftp-individual.sh
```

**Resultado**: ✅ Completado exitosamente

**Output**:
```
2026-01-09 20:58:07 - 🔗 Link creado: latest_pixelcv_db.gz → pixelcv_db_20260109_205730.sql.gz
2026-01-09 20:58:07 - 📊 Desglose de backups:
2026-01-09 20:58:07 -    • Bases de datos SQL: 34 archivos
2026-01-09 20:58:07 - ✅ Backup individual completado exitosamente
2026-01-09 20:58:07 - 🔄 Política de retención: 7 días automática
```

### Archivo Generado

```
Archivo:    /home/backup-db/databases/pixelcv_db_20260109_205730.sql.gz
Tamaño:     236 KB
Symlink:    /home/backup-db/databases/latest_pixelcv_db.gz
Tablas:     14
Registros:  358
```

---

## Comandos de Gestión

### Ver backups disponibles
```bash
ls -la /home/backup-db/databases/pixelcv_db*.gz
```

### Ver contenido del backup más reciente
```bash
gunzip -c /home/backup-db/databases/latest_pixelcv_db.gz | less
```

### Restaurar backup completo
```bash
# Precaución: Esto sobrescribe la base de datos actual
gunzip -c /home/backup-db/databases/latest_pixelcv_db.gz | \
    mariadb -u root -p pixelcv_db
```

### Restaurar tabla específica
```bash
# Extraer solo la tabla 'users'
gunzip -c /home/backup-db/databases/latest_pixelcv_db.gz | \
    sed -n '/Table structure for table `users`/,/UNLOCK TABLES;/p' | \
    mariadb -u root -p pixelcv_db
```

### Ver logs del último backup
```bash
tail -50 /home/backup-db/logs/backup_individual_*.log | grep pixelcv
```

### Ejecutar backup manual (fuera de cron)
```bash
bash /root/scripts/backup-databases-ftp-individual.sh
```

---

## Cambios en Scripts del Servidor

### Modificación: `/root/scripts/backup-databases-ftp-individual.sh`

**Removida** la entrada obsoleta de SQLite:

```diff
- # Lista de archivos SQLite a respaldar
- SQLITE_DBS=(
-     "/root/pixelcv/backend/pixelcv.db:pixelcv"
- )
+ # Lista de archivos SQLite a respaldar
+ # NOTA: PixelCV ahora usa MariaDB (pixelcv_db) y se incluye en el backup automático de MariaDB
+ SQLITE_DBS=(
+ )
```

**Razón**: PixelCV ya no usa SQLite. La base de datos `pixelcv_db` en MariaDB se incluye automáticamente en el backup dinámico del servidor.

---

## Monitoreo y Mantenimiento

### Verificar estado del backup
```bash
cat /home/backup-db/databases/last_backup_status.txt
```

### Ver espacio utilizado por backups
```bash
du -sh /home/backup-db/databases/
ls -lh /home/backup-db/databases/pixelcv_db*.gz
```

### Contar archivos de backup disponibles
```bash
find /home/backup-db/databases/ -name "pixelcv_db_*.sql.gz" | wc -l
```

### Ver fecha del último backup
```bash
stat /home/backup-db/databases/latest_pixelcv_db.gz | grep Modify
```

---

## Detalles Técnicos

### Formato del Backup

El backup es un **dump SQL completo** generado por `mysqldump`:

```bash
mysqldump -u root -p"<password>" \
    --single-transaction \    # Snapshot consistente
    --routines \              # Incluir stored procedures
    --triggers \              # Incluir triggers
    --events \                # Incluir eventos
    pixelcv_db > pixelcv_db_DATE.sql
```

### Compresión

```bash
gzip pixelcv_db_DATE.sql
# Resultado: pixelcv_db_DATE.sql.gz (≈ 80% reducción)
```

### Limpieza Automática

El script elimina backups mayores a 7 días:

```bash
find "$BACKUP_DIR" -name "*_[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]_*.sql.gz" \
    -mtime +7 -type f -delete
```

---

## Política de Retención

| Edad del archivo | Estado |
|------------------|--------|
| **0-7 días** | ✅ Mantenido |
| **+7 días** | 🗑️ Eliminado automáticamente |

**Espacio estimado**:
- Backup promedio: ~240 KB comprimido
- 7 días de backups: ~1.7 MB
- Todas las BDs del servidor: ~900 MB (34 BDs)

---

## Tablas Respaldadas

| Tabla | Registros | Descripción |
|-------|-----------|-------------|
| `users` | 3 | Usuarios del sistema |
| `user_profiles` | 3 | Perfiles extendidos |
| `cvs` | 3 | CVs creados |
| `comments` | 0 | Comentarios de CVs |
| `likes` | 0 | Likes de CVs |
| `visits` | 340 | Visitas a CVs públicos |
| `point_history` | 0 | Historial de puntos |
| `game_sessions` | 0 | Sesiones de juegos |
| `pixel_art` | 12 | Arte pixel creado |
| `pixel_art_comments` | 0 | Comentarios de arte |
| `pixel_art_likes` | 0 | Likes de arte |
| `ai_parameter_history` | 0 | Historial de IA |
| `game_ai_parameters` | 0 | Parámetros IA juegos |
| `game_training_data` | 0 | Datos de entrenamiento |
| **Total** | **358** | |

---

## Documentación Relacionada

| Documento | Ubicación |
|-----------|-----------|
| Migración a MariaDB | `/root/pixelcv/docs/development/sqlite-to-mariadb-migration-2026-01-09.md` |
| Backup del servidor | `/root/docs/20-scripts-backup/pixelcv-mariadb-backup-2026-01-09.md` |
| Script de backup | `/root/scripts/backup-databases-ftp-individual.sh` |
| Comandos del servidor | `/root/DOCUMENTACION-COMANDOS-GESTION.md` |

---

## Checklist de Validación

- [x] Base de datos `pixelcv_db` creada en MariaDB
- [x] Usuario `pixelcv_user` con permisos configurados
- [x] 358 registros migrados desde SQLite
- [x] Backup automático del servidor detecta `pixelcv_db`
- [x] Script de backup actualizado (SQLite removido)
- [x] Backup manual ejecutado y validado
- [x] Archivo `.sql.gz` generado correctamente
- [x] Symlink `latest_pixelcv_db.gz` creado
- [x] Documentación creada

---

## Próximos Pasos

Opcional: Considerar replicación MariaDB para alta disponibilidad:

```bash
# Ver documentación de replicación existente
cat /root/DOCUMENTACION-REPLICACION-MARIADB.md
```

---

**Estado**: ✅ PixelCV está completamente protegido por el sistema de backup automatizado del servidor.

**Próximo backup automático**: Mañana a las 02:00 AM UTC
