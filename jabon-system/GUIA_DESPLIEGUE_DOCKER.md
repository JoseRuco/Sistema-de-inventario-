# 🚀 Guía Completa de Despliegue en VPS Hostinger con Docker

Esta guía te llevará paso a paso para desplegar tu **Sistema de Inventario** en un VPS de Hostinger utilizando **Docker** de forma segura y profesional.

---

## 📋 Tabla de Contenidos

1. [Prerrequisitos](#-1-prerrequisitos)
2. [Preparación del VPS](#%EF%B8%8F-2-preparación-del-vps-hostinger)
3. [Configuración del Proyecto](#-3-configuración-del-proyecto)
4. [Despliegue de la Aplicación](#-4-despliegue-de-la-aplicación)
5. [Configuración de Dominio y SSL](#-5-configuración-de-dominio-y-ssl)
6. [Sistema de Backups](#-6-sistema-de-backups-automáticos)
7. [Mantenimiento](#-7-mantenimiento-y-actualización)
8. [Solución de Problemas](#-8-solución-de-problemas-comunes)

---

## 📋 1. Prerrequisitos

Antes de comenzar, asegúrate de tener:

### En el VPS de Hostinger:

- ✅ **IP Pública del VPS** (Hostinger te la proporciona)
- ✅ **Acceso SSH** (Usuario: `root` + contraseña proporcionada por Hostinger)
- ✅ **Plan VPS activo** (mínimo 1GB RAM recomendado)

### En tu computadora local:

- ✅ **Código subido a GitHub/GitLab** (recomendado) o archivos listos para transferir
- ✅ **Dominio web** (si ya lo compraste)
- ✅ **Cliente SSH** (PowerShell en Windows, Terminal en Mac/Linux)

> [!IMPORTANT]
> Asegúrate de haber guardado todos tus cambios locales y hacer commit de tus últimas modificaciones antes de desplegar.

---

## 🛠️ 2. Preparación del VPS (Hostinger)

### 2.1 Conectarse al VPS

Desde PowerShell o CMD en Windows:

```powershell
ssh root@TU_IP_DEL_VPS
# Escribe tu contraseña cuando te la pida
```

Ejemplo: `ssh root@203.0.113.45`

### 2.2 Actualizar el Sistema

Una vez dentro del VPS, ejecuta:

```bash
apt update && apt upgrade -y
```

### 2.3 Instalar Docker y Docker Compose

Ejecuta estos comandos uno por uno:

```bash
# Instalar requisitos previos
apt install -y apt-transport-https ca-certificates curl software-properties-common

# Añadir llave GPG de Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Añadir repositorio de Docker
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
apt update
apt install -y docker-ce docker-compose-plugin

# Verificar instalación
docker --version
docker compose version
```

Deberías ver algo como:

```
Docker version 24.x.x
Docker Compose version v2.x.x
```

### 2.4 Instalar Git

```bash
apt install -y git
```

### 2.5 Configurar Firewall (UFW)

```bash
# Instalar UFW si no está instalado
apt install -y ufw

# Permitir SSH (IMPORTANTE: hacerlo antes de activar el firewall)
ufw allow 22/tcp

# Permitir HTTP y HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Activar firewall
ufw enable

# Verificar estado
ufw status
```

---

## 🔧 3. Configuración del Proyecto

### 3.1 Crear Directorio del Proyecto

```bash
mkdir -p /var/www/jabon-system
cd /var/www/jabon-system
```

### 3.2 Clonar el Repositorio

Si usas Git (recomendado):

```bash
git clone TU_URL_DEL_REPOSITORIO .
```

Ejemplo: `git clone https://github.com/tuusuario/jabon-system.git .`

> [!TIP]
> Si tu repositorio es privado, necesitarás configurar tus credenciales de Git o usar SSH keys.

**Alternativa sin Git**: Usa FileZilla o SCP para subir los archivos manualmente.

### 3.3 Configurar Variables de Entorno

Edita el archivo de variables de entorno del backend:

```bash
cd /var/www/jabon-system/backend
nano .env.production
```

Actualiza las siguientes variables con tus valores reales:

```env
PORT=3000
NODE_ENV=production

# ⚠️ IMPORTANTE: Cambiar por tu dominio real
ALLOWED_ORIGIN=https://tudominio.com

DB_PATH=./db/database_vieja.db

# Configuración SMTP (si usas Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-contraseña-de-aplicacion

ALERT_EMAIL=destinatario@ejemplo.com

# Seguridad
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

LOG_LEVEL=info
```

> [!WARNING]
>
> - Si usas Gmail, necesitas una **contraseña de aplicación**, no tu contraseña normal
> - Genera una en: https://myaccount.google.com/apppasswords

Guarda el archivo: `Ctrl+O`, Enter, `Ctrl+X`

### 3.4 Crear Directorio de Backups

```bash
cd /var/www/jabon-system
mkdir -p backups
chmod 755 backups
```

### 3.5 Dar Permisos a los Scripts

```bash
chmod +x scripts/backup.sh
chmod +x scripts/deploy.sh
```

---

## 🚀 4. Despliegue de la Aplicación

### 4.1 Construir e Iniciar los Contenedores

Desde el directorio del proyecto (`/var/www/jabon-system`):

```bash
cd /var/www/jabon-system
docker compose up -d --build
```

Este comando:

- `up`: Levanta los servicios
- `-d`: En modo "detached" (segundo plano)
- `--build`: Construye las imágenes desde cero

La primera vez tomará varios minutos (5-10 min) mientras descarga las imágenes base y compila todo.

### 4.2 Verificar el Estado

Comprueba que todo esté corriendo:

```bash
docker compose ps
```

Deberías ver algo como:

```
NAME                IMAGE                    STATUS                    PORTS
jabon-backend       jabon-system-backend     Up (healthy)             0.0.0.0:3000->3000/tcp
jabon-frontend      jabon-system-frontend    Up (healthy)             0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
```

### 4.3 Ver Logs

Para ver si hay errores:

```bash
# Ver logs de ambos servicios
docker compose logs

# Ver logs solo del backend
docker compose logs backend

# Ver logs en tiempo real
docker compose logs -f
```

---

## 🌐 5. Configuración de Dominio y SSL

### 5.1 Verificar Acceso por IP

Antes de configurar el dominio, verifica que funciona por IP:

Abre tu navegador y entra a: `http://TU_IP_DEL_VPS`

Deberías ver tu aplicación funcionando.

### 5.2 Configurar DNS del Dominio

En el panel de tu proveedor de dominio (GoDaddy, Namecheap, Hostinger, etc.):

1. Ve a la configuración de DNS
2. Crea un registro **A** con estos valores:
   - **Nombre/Host**: `@` (para el dominio raíz) o `www`
   - **Tipo**: `A`
   - **Valor/IP**: `TU_IP_DEL_VPS`
   - **TTL**: `3600` (o automático)

3. Si quieres que funcione con y sin `www`, crea dos registros:
   - `@` → `TU_IP_DEL_VPS`
   - `www` → `TU_IP_DEL_VPS`

> [!TIP]
> Los cambios de DNS pueden tardar entre 5 minutos y 48 horas en propagarse, pero normalmente toma menos de 1 hora.

### 5.3 Instalar Certbot para SSL (HTTPS)

Una vez que tu dominio apunte al VPS, instala Certbot:

```bash
# Instalar Certbot
apt install -y certbot python3-certbot-nginx

# Detener temporalmente el contenedor frontend
cd /var/www/jabon-system
docker compose stop frontend
```

Genera el certificado SSL:

```bash
# Reemplaza tudominio.com con tu dominio real
certbot certonly --standalone -d tudominio.com -d www.tudominio.com
```

Sigue las instrucciones:

- Ingresa tu email
- Acepta los términos de servicio
- (Opcional) Acepta compartir tu email con EFF

Si todo sale bien, verás:

```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/tudominio.com/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/tudominio.com/privkey.pem
```

### 5.4 Configurar Nginx para SSL

Edita la configuración de Nginx:

```bash
cd /var/www/jabon-system
nano nginx.conf
```

Descomenta y actualiza la sección SSL al final del archivo:

```nginx
# Descomentar esta sección completa y actualizar con tu dominio

server {
    listen 443 ssl http2;
    server_name tudominio.com www.tudominio.com;

    # Certificados SSL
    ssl_certificate /etc/letsencrypt/live/tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tudominio.com/privkey.pem;

    # Configuración SSL moderna
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # Copiar aquí toda la configuración del servidor HTTP (desde client_max_body_size hasta el final)
    # ... (resto de la configuración)
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;
    return 301 https://$server_name$request_uri;
}
```

También actualiza el `docker-compose.yml` para montar los certificados:

```bash
nano docker-compose.yml
```

En la sección `frontend`, descomenta la línea de volumen SSL:

```yaml
volumes:
  - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
  - /etc/letsencrypt:/etc/letsencrypt:ro # ← Descomentar esta línea
```

Reinicia los contenedores:

```bash
docker compose up -d --force-recreate
```

### 5.5 Renovación Automática de SSL

Certbot necesita renovar los certificados cada 90 días. Configura la renovación automática:

```bash
# Crear script de renovación
nano /root/renew-ssl.sh
```

Contenido del script:

```bash
#!/bin/bash
cd /var/www/jabon-system
docker compose stop frontend
certbot renew --quiet
docker compose start frontend
```

Guardar y dar permisos:

```bash
chmod +x /root/renew-ssl.sh
```

Agregar al crontab para que se ejecute mensualmente:

```bash
crontab -e
```

Añadir esta línea al final:

```cron
0 3 1 * * /root/renew-ssl.sh >> /var/log/certbot-renew.log 2>&1
```

Esto ejecutará el script el día 1 de cada mes a las 3:00 AM.

---

## 💾 6. Sistema de Backups Automáticos

### 6.1 Probar el Script de Backup Manualmente

```bash
cd /var/www/jabon-system
bash scripts/backup.sh
```

Deberías ver:

```
🔄 Creando backup de la base de datos...
✅ Backup creado: /var/www/jabon-system/backups/backup_20260121_123456.db.gz
📦 Tamaño: 245K
🧹 Limpiando backups antiguos (más de 30 días)...
✅ Limpieza completada
📊 Total de backups: 1
```

### 6.2 Configurar Backups Automáticos

Edita el crontab:

```bash
crontab -e
```

Añade esta línea para backup diario a las 2:00 AM:

```cron
0 2 * * * /var/www/jabon-system/scripts/backup.sh >> /var/log/backup.log 2>&1
```

Para backups cada 6 horas:

```cron
0 */6 * * * /var/www/jabon-system/scripts/backup.sh >> /var/log/backup.log 2>&1
```

Verifica que se agregó correctamente:

```bash
crontab -l
```

---

## 🔄 7. Mantenimiento y Actualización

### 7.1 Usar el Script de Despliegue Interactivo

El sistema incluye un script interactivo para facilitar el mantenimiento:

```bash
cd /var/www/jabon-system
bash scripts/deploy.sh
```

Este script te permite:

1. 🚀 Despliegue completo (Backup + Pull + Rebuild)
2. 🔄 Actualizar código y reiniciar
3. ♻️ Reiniciar contenedores
4. 📊 Ver estado
5. 📋 Ver logs
6. 📦 Crear backup manual
7. 🧹 Limpiar Docker

### 7.2 Comandos Manuales Útiles

**Ver estado de contenedores:**

```bash
docker compose ps
```

**Ver logs:**

```bash
docker compose logs -f backend
docker compose logs -f frontend
```

**Reiniciar todo:**

```bash
docker compose restart
```

**Detener y levantar (con cambios):**

```bash
docker compose down
docker compose up -d
```

**Actualizar desde Git:**

```bash
cd /var/www/jabon-system
git pull origin main
docker compose up -d --build
```

**Ver uso de recursos:**

```bash
docker stats
```

**Limpiar imágenes sin usar:**

```bash
docker system prune -a
```

---

## 🆘 8. Solución de Problemas Comunes

### Problema: Los contenedores no inician

**Solución:**

```bash
# Ver logs detallados
docker compose logs

# Verificar que no haya problemas de sintaxis en docker-compose.yml
docker compose config
```

### Problema: Error de permisos en base de datos

**Solución:**

```bash
cd /var/www/jabon-system
chmod -R 777 backend/db
docker compose restart backend
```

### Problema: El backend no puede conectarse

**Solución:**

```bash
# Verificar que el contenedor backend esté healthy
docker compose ps

# Ver logs del backend
docker compose logs backend

# Verificar variables de entorno
docker compose exec backend env | grep NODE_ENV
```

### Problema: CORS errors en el navegador

**Solución:**
Verifica que `ALLOWED_ORIGIN` en `.env.production` coincida exactamente con tu dominio:

```bash
nano backend/.env.production
# Debe ser: ALLOWED_ORIGIN=https://tudominio.com (sin trailing slash)

docker compose restart backend
```

### Problema: "Too many requests" error

**Solución:**
Si necesitas ajustar el rate limiting:

```bash
nano backend/.env.production
# Cambiar: RATE_LIMIT_MAX_REQUESTS=200 (o el valor que necesites)

docker compose restart backend
```

### Problema: El sitio no carga después de configurar SSL

**Solución:**

```bash
# Verificar que los certificados existan
ls -la /etc/letsencrypt/live/tudominio.com/

# Verificar que nginx.conf esté bien configurado
docker compose exec frontend nginx -t

# Ver logs de nginx
docker compose logs frontend
```

### Problema: Espacio en disco lleno

**Solución:**

```bash
# Ver uso de disco
df -h

# Limpiar logs antiguos
journalctl --vacuum-time=7d

# Limpiar Docker
docker system prune -a --volumes

# Limpiar backups muy antiguos
find /var/www/jabon-system/backups -name "backup_*.db.gz" -mtime +60 -delete
```

---

## 📞 Comandos de Referencia Rápida

```bash
# Navegar al proyecto
cd /var/www/jabon-system

# Ver estado
docker compose ps

# Ver logs en tiempo real
docker compose logs -f

# Reiniciar todo
docker compose restart

# Actualizar aplicación
git pull && docker compose up -d --build

# Crear backup manual
bash scripts/backup.sh

# Usar menú interactivo
bash scripts/deploy.sh

# Ver uso de recursos
docker stats
```

---

## ✅ Checklist Final

Después de completar el despliegue, verifica:

- [ ] La aplicación es accesible via `https://tudominio.com`
- [ ] El certificado SSL muestra el candado verde
- [ ] Los contenedores tienen estado "healthy": `docker compose ps`
- [ ] Los backups se están creando: `ls -lh backups/`
- [ ] Las variables de entorno están configuradas correctamente
- [ ] El firewall está activo y configurado: `ufw status`
- [ ] Los cron jobs están configurados: `crontab -l`

---

## 🎉 ¡Listo!

Tu Sistema de Inventario ahora está desplegado de forma segura y profesional en producción.

**Próximos pasos recomendados:**

1. Configura monitoreo (opcional): UptimeRobot, Pingdom
2. Haz pruebas completas de funcionalidad
3. Capacita a los usuarios finales
4. Documenta cualquier configuración personalizada

**Soporte:**

- Logs del backend: `docker compose logs backend`
- Logs del frontend: `docker compose logs frontend`
- Backups: `/var/www/jabon-system/backups/`

---

_Desarrollado por: JOSE RUCO - PROGRAMMER {JR}_
