#!/bin/bash

# ===================================
# Script de Despliegue y Actualización
# ===================================
# Este script facilita el despliegue y actualización del sistema
# en el VPS

set -e  # Salir si hay algún error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
PROJECT_DIR="/var/www/jabon-system"
BACKUP_SCRIPT="$PROJECT_DIR/scripts/backup.sh"

echo -e "${BLUE}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🧼 Sistema de Inventario - Script de Despliegue  ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════╝${NC}"
echo ""

# Función para crear backup antes de actualizar
create_backup() {
    echo -e "${YELLOW}📦 Creando backup antes de actualizar...${NC}"
    if [ -f "$BACKUP_SCRIPT" ]; then
        bash "$BACKUP_SCRIPT"
    else
        echo -e "${YELLOW}⚠️  Script de backup no encontrado, continuando sin backup${NC}"
    fi
}

# Función para actualizar código desde Git
update_code() {
    echo -e "${BLUE}🔄 Actualizando código desde repositorio...${NC}"
    cd "$PROJECT_DIR"
    
    # Guardar cambios locales si los hay
    if [[ -n $(git status -s) ]]; then
        echo -e "${YELLOW}⚠️  Hay cambios locales, guardándolos...${NC}"
        git stash
    fi
    
    # Pull desde el repositorio
    git pull origin main
    
    echo -e "${GREEN}✅ Código actualizado${NC}"
}

# Función para reconstruir y reiniciar contenedores
rebuild_containers() {
    echo -e "${BLUE}🔨 Reconstruyendo contenedores...${NC}"
    cd "$PROJECT_DIR"
    
    # Detener contenedores actuales
    docker compose down
    
    # Reconstruir imágenes
    docker compose build --no-cache
    
    # Levantar contenedores
    docker compose up -d
    
    echo -e "${GREEN}✅ Contenedores reconstruidos y levantados${NC}"
}

# Función para reiniciar contenedores sin reconstruir
restart_containers() {
    echo -e "${BLUE}🔄 Reiniciando contenedores...${NC}"
    cd "$PROJECT_DIR"
    
    docker compose restart
    
    echo -e "${GREEN}✅ Contenedores reiniciados${NC}"
}

# Función para mostrar estado
show_status() {
    echo -e "${BLUE}📊 Estado de los contenedores:${NC}"
    cd "$PROJECT_DIR"
    docker compose ps
    echo ""
    echo -e "${BLUE}📊 Logs recientes:${NC}"
    docker compose logs --tail=20
}

# Función para ver logs en tiempo real
show_logs() {
    echo -e "${BLUE}📋 Mostrando logs en tiempo real (Ctrl+C para salir)...${NC}"
    cd "$PROJECT_DIR"
    docker compose logs -f
}

# Función para limpiar recursos de Docker
cleanup_docker() {
    echo -e "${YELLOW}🧹 Limpiando recursos de Docker...${NC}"
    
    # Eliminar contenedores detenidos
    docker container prune -f
    
    # Eliminar imágenes sin usar
    docker image prune -f
    
    # Eliminar volúmenes sin usar
    docker volume prune -f
    
    echo -e "${GREEN}✅ Limpieza completada${NC}"
}

# Menú principal
show_menu() {
    echo ""
    echo -e "${GREEN}Selecciona una opción:${NC}"
    echo "1) 🚀 Despliegue completo (Backup + Pull + Rebuild)"
    echo "2) 🔄 Actualizar código y reiniciar"
    echo "3) ♻️  Reiniciar contenedores"
    echo "4) 📊 Ver estado"
    echo "5) 📋 Ver logs"
    echo "6) 📦 Crear backup"
    echo "7) 🧹 Limpiar Docker"
    echo "8) ❌ Salir"
    echo ""
}

# Bucle principal
while true; do
    show_menu
    read -p "Opción: " option
    
    case $option in
        1)
            create_backup
            update_code
            rebuild_containers
            show_status
            ;;
        2)
            create_backup
            update_code
            restart_containers
            show_status
            ;;
        3)
            restart_containers
            show_status
            ;;
        4)
            show_status
            ;;
        5)
            show_logs
            ;;
        6)
            create_backup
            ;;
        7)
            cleanup_docker
            ;;
        8)
            echo -e "${GREEN}👋 ¡Hasta luego!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Opción inválida${NC}"
            ;;
    esac
    
    echo ""
    read -p "Presiona Enter para continuar..."
done
