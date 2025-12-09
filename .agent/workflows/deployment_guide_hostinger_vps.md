---
description: Guía paso a paso para desplegar el Sistema de Inventario en un VPS de Hostinger usando Git, Nginx y SSL.
---

# Guía de Despliegue en Hostinger VPS (Ubuntu)

Esta guía detalla los pasos para desplegar tu aplicación (Frontend Vite + Backend Express/SQLite) en un VPS de Hostinger de forma segura.

## 1. Preparativos Iniciales

### En tu máquina local:

1. Asegúrate de que tu proyecto esté **subido a tu repositorio Git** (GitHub/GitLab).
2. Verifica que el archivo `vite.config.js` en el frontend NO tenga configuraciones fijas de `host` o `port` que entren en conflicto (lo que tienes ahora está bien).
3. Asegúrate de que tu backend escuche en un puerto configurable (ej: `process.env.PORT || 3000`).

### Acceso al VPS:

Necesitarás la IP de tu VPS y la contraseña de `root` (o una clave SSH configurada).

```bash
# Conéctate por SSH (Usa Terminal/PowerShell)
ssh root@TU_IP_DEL_VPS
```

---

## 2. Configurar el Entorno en el VPS

Una vez dentro del VPS, actualiza el sistema e instala las herramientas necesarias via terminal:

```bash
# Actualizar lista de paquetes
apt update && apt upgrade -y

# Instalar Node.js (Versión LTS 20.x recomendada)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Instalar Git, Nginx y herramientas de compilación (para SQLite)
apt install -y git nginx build-essential

# Verificar instalaciones
node -v
npm -v
git --version
nginx -v
```

---

## 3. Clonar el Proyecto

Vamos a guardar el proyecto en `/var/www/jabon-system`.

```bash
# Crear directorio y entrar
mkdir -p /var/www/jabon-system
cd /var/www/jabon-system

# Clonar tu repositorio (reemplaza la URL con la tuya)
# Si es privado, te pedirá usuario/token o usa SSH keys
git clone https://github.com/TU_USUARIO/TU_REPO.git .
```

---

## 4. Configurar el Backend

```bash
# Entrar a la carpeta del backend
cd backend

# Instalar dependencias
npm install

# Crear archivo de entorno de producción
nano .env
```

**Contenido sugerido para `.env`**:

```env
PORT=3000
NODE_ENV=production
# Agrega cualquier otra variable, como configuración de email
```

_(Guarda con `Ctrl+O`, `Enter` y sal con `Ctrl+X`)_

### Configurar PM2 (Gestor de Procesos)

PM2 mantendrá tu backend vivo 24/7.

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar el servidor
pm2 start src/server.js --name "jabon-backend"

# Configurar PM2 para que inicie con el sistema
pm2 startup
# (Copia y pega el comando que te muestre la terminal)
pm2 save
```

---

## 5. Configurar el Frontend

```bash
# Ir a la carpeta del frontend
cd ../frontend

# Instalar dependencias
npm install

# Construir la versión de producción
npm run build
```

Esto creará una carpeta `dist` dentro de `frontend`. Esta carpeta contiene tu PWA optimizada.

---

## 6. Configurar Nginx (Reverse Proxy)

Nginx servirá los archivos estáticos del frontend y redirigirá las peticiones `/api` al backend.

```bash
# Crear configuración para tu sitio
nano /etc/nginx/sites-available/jabon-system
```

**Pega el siguiente contenido (ajustando `tu_dominio.com` o tu IP):**

```nginx
server {
    listen 80;
    server_name tu_dominio.com www.tu_dominio.com; # O usa tu IP si no tienes dominio aún

    root /var/www/jabon-system/frontend/dist;
    index index.html;

    # Configuración para la PWA (Frontend)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy para el Backend (API)
    location /api {
        proxy_pass http://localhost:3000; # Puerto de tu backend
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Cache para assets estáticos (mejora rendimiento PWA)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

```bash
# Activar el sitio
ln -s /etc/nginx/sites-available/jabon-system /etc/nginx/sites-enabled/

# Verificar si hay errores y reiniciar Nginx
nginx -t
systemctl restart nginx
```

---

## 7. Configurar Firewall (UFW)

Protege tu servidor cerrando puertos innecesarios.

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

---

## 8. Configurar HTTPS (Certificado SSL con Certbot)

Para que la PWA sea instalable, **NECESITAS HTTPS**.

1.  Asegúrate de que tu dominio apunte a la IP de tu VPS (Configuración DNS tipo A).
2.  Instala y ejecuta Certbot:

```bash
# Instalar Certbot
apt install -y certbot python3-certbot-nginx

# Obtener certificado (Sigue las instrucciones en pantalla)
certbot --nginx -d tu_dominio.com -d www.tu_dominio.com
```

Certbot configurará automáticamente la redirección HTTPS en Nginx.

---

## 9. Mantenimiento y Actualizaciones Futuras

Cuando hagas cambios en tu código y quieras actualizar el VPS:

```bash
# 1. Entrar al servidor
ssh root@TU_IP

# 2. Ir a la carpeta
cd /var/www/jabon-system

# 3. Traer cambios de git
git pull

# Si actualizaste el BACKEND:
cd backend
npm install # (solo si hay nuevas dependencias)
pm2 restart jabon-backend

# Si actualizaste el FRONTEND:
cd ../frontend
npm install # (solo si hay nuevas dependencias)
npm run build
```
