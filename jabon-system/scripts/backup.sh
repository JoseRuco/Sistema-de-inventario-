#!/bin/bash

# ===================================
# Script de Backup de Base de Datos
# ===================================
# Este script crea un backup de la base de datos SQLite
# y lo guarda en el directorio de backups con fecha y hora

# Configuración
BACKUP_DIR="/var/www/jabon-system/backups"
DB_PATH="/var/www/jabon-system/backend/db/database_vieja.db"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.db"

# Configuración de retención (días)
RETENTION_DAYS=30

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR"

# Crear backup
echo "🔄 Creando backup de la base de datos..."
if [ -f "$DB_PATH" ]; then
    cp "$DB_PATH" "$BACKUP_FILE"
    
    # Comprimir el backup
    gzip "$BACKUP_FILE"
    BACKUP_FILE="${BACKUP_FILE}.gz"
    
    echo "✅ Backup creado: $BACKUP_FILE"
    
    # Mostrar tamaño del backup
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "📦 Tamaño: $BACKUP_SIZE"
else
    echo "❌ Error: No se encontró la base de datos en $DB_PATH"
    exit 1
fi

# Limpiar backups antiguos
echo "🧹 Limpiando backups antiguos (más de $RETENTION_DAYS días)..."
find "$BACKUP_DIR" -name "backup_*.db.gz" -type f -mtime +$RETENTION_DAYS -delete
echo "✅ Limpieza completada"

# Mostrar resumen de backups
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/backup_*.db.gz 2>/dev/null | wc -l)
echo "📊 Total de backups: $BACKUP_COUNT"

exit 0
