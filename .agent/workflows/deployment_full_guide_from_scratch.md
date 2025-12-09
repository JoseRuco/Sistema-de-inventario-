---
description: Guía maestra desde cero para desplegar el Sistema de Inventario: desde Git hasta Hostinger VPS.
---

# Guía Maestra de Despliegue: De Local a VPS Hostinger

Esta guía cubre todo el proceso: subir tu código a GitHub, comprar el servidor adecuado y configurarlo para que tu App funcione con HTTPS (necesario para la PWA).

## FASE 1: Preparar y Subir el Código a GitHub

Actualmente tienes muchos cambios locales sin guardar. Primero debemos asegurar todo en la nube.

### 1. Limpiar y Preparar Git (En tu PC)

Abre tu terminal en la carpeta del proyecto (`jabon-system`) y ejecuta:

```bash
# 1. Ver qué archivos se van a subir
git status

# 2. Agregar TODOS los archivos al control de versiones
git add .

# 3. Guardar los cambios con un mensaje
git commit -m "Preparación final para despliegue en VPS"

# 4. Subir a GitHub
git push origin master
```

_Si tienes errores de autenticación, GitHub te pedirá loguearte en el navegador._ Note: Ya tienes configurado un 'origin', así que esto debería funcionar directo.

---

## FASE 2: Comprar el VPS en Hostinger

Si aún no tienes el servidor, sigue estos pasos para comprar el adecuado y económico.

1.  Ve a [Hostinger VPS](https://www.hostinger.com/vps-hosting).
2.  **Elige el Plan "KVM 1"** (o "KVM 2" si esperas muchos usuarios, pero el 1 es suficiente para empezar).
    - _KVM 1_: 4GB RAM, 50GB disco (Suficiente y recomendado).
3.  Termina la compra.
4.  **Configuración Inicial (Panel de Hostinger)**:
    - Te pedirá elegir un Sistema Operativo. Elige: **Ubuntu 22.04 64bit**.
    - Te pedirá crear una contraseña para el usuario `root`. **¡Guárdala muy bien!** Es la llave maestra de tu servidor.

---

## FASE 3: Conectarse al Servidor

Una vez el VPS esté activo (tarda unos 5 minutos), verás una **Dirección IP** (ej: `123.45.67.89`) en tu panel.

### Desde tu PC (Windows PowerShell o Terminal):

```powershell
ssh root@TU_IP_DEL_VPS
# Ejemplo: ssh root@185.24.11.33
```

_Te preguntará "Are you sure...?", escribe `yes`. Luego pon la contraseña que creaste (no se verá mientras escribes)._

---

## FASE 4: Instalación del Entorno (Dentro del VPS)

Copia y pega estos comandos en la terminal negra de tu servidor (clic derecho para pegar).

### 1. Actualizar e Instalar Node.js y Herramientas

```bash
# Actualizar el sistema
apt update && apt upgrade -y

# Instalar Node.js v20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Instalar Nginx (Servidor Web) y Git
apt install -y nginx git build-essential

# Instalar PM2 (Para mantener el backend vivo)
npm install -g pm2
```

### 2. Clonar tu Proyecto

Vamos a poner tu código en la carpeta `/var/www/jabon-system`.

```bash
mkdir -p /var/www/jabon-system
cd /var/www/jabon-system

# Clona TU repositorio (cambia la URL por la tuya de GitHub)
git clone https://github.com/Josuruco/sistema-inventario.git .
# (Nota: Verifica la URL exacta de tu repo en GitHub)
```

---

## FASE 5: Instalar Dependencias y Configurar

### 1. El Backend (API)

```bash
cd backend
npm install

# Iniciar el backend con PM2
pm2 start src/server.js --name "backend-inventario"

# Guardar para que inicie si se reinicia el servidor
pm2 startup
pm2 save
```

### 2. El Frontend (PWA)

```bash
cd ../frontend
npm install

# Construir la versión optimizada (producción)
npm run build
```

---

## FASE 6: Conectar al Mundo (Nginx)

Nginx hará que cuando alguien escriba tu IP o dominio, vea tu página web.

```bash
# Crear archivo de configuración
nano /etc/nginx/sites-available/inventario
```

**Pega este contenido dentro** (Usa las flechas para moverte):

```nginx
server {
    listen 80 default_server;
    # Si tienes dominio ponlo aquí, si no, deja el _
    server_name _;

    # Carpeta donde está el frontend construido
    root /var/www/jabon-system/frontend/dist;
    index index.html;

    # Configuración PWA (Navegación React)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Redirigir la API al backend interno (puerto 3000)
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Guardar**: Presiona `Ctrl + O`, `Enter` y luego `Ctrl + X`.

**Activar y Reiniciar**:

```bash
# Borrar la config por defecto
rm /etc/nginx/sites-enabled/default

# Activar la nueva
ln -s /etc/nginx/sites-available/inventario /etc/nginx/sites-enabled/

# Reiniciar Nginx
systemctl restart nginx
```

¡En este punto, si pones la IP de tu VPS en el navegador, **YA DEBERÍAS VER TU APP**!

---

## FASE 7: El Candado Verde (HTTPS) - ¡CRUCIAL PARA PWA!

Para que se instale como App en Android, necesitas HTTPS.
**Requisito**: Debes comprar un dominio (ej: `misistema.com`) en Hostinger (cuestan como $1 - $10 USD/año) y en los DNS apuntarlo a la IP de tu VPS.

Una vez tengas el dominio apuntando a la IP:

```bash
# Instalar Certbot
apt install -y certbot python3-certbot-nginx

# Generar el certificado automático
certbot --nginx -d tudominio.com
```

¡Listo! Tu sistema estará en `https://tudominio.com`, 100% seguro y descargable como App Nativa.
