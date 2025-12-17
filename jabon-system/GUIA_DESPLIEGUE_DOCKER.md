# 🚀 Guía Completa de Despliegue en VPS Hostinger con Docker

Esta guía te llevará paso a paso para desplegar tu **Sistema de Inventario** en un VPS de Hostinger utilizando **Docker**.

> **🌟 Estado Actual:** He optimizado automáticamente la configuración de tu proyecto (`docker-compose.yml`, `Dockerfile`, `server.js`, `api.js`) para que esté listo para producción.

---

## 📋 1. Prerrequisitos

Antes de comenzar, asegúrate de tener:

1.  **Acceso al VPS de Hostinger**: Necesitarás la **IP Pública**, el **Usuario** (usualmente `root`) y la **Contraseña**.
2.  **Código Subido**: Asegúrate de subir los últimos cambios (incluidos los que acabo de hacer) a tu repositorio (GitHub/GitLab).
    - Si no usas GitHub, puedes subir el código manualmente al servidor vía SFTP/SCP, pero Git es recomendado.

---

## 🛠️ 2. Preparación del VPS (Hostinger)

Conéctate a tu servidor mediante la terminal (PowerShell o CMD en Windows):

```powershell
ssh root@TU_IP_DEL_VPS
# Escribe tu contraseña cuando te la pida
```

### 2.1 Actualizar el Sistema

Una vez dentro del VPS, ejecuta:

```bash
apt update && apt upgrade -y
```

### 2.2 Instalar Docker y Docker Compose

Ejecuta estos comandos uno por uno para instalar el motor de Docker:

```bash
# Instalar requisitos
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

### 2.3 Instalar Git

```bash
apt install -y git
```

---

## 🚀 3. Despliegue de la Aplicación

### 3.1 Clonar el Repositorio

Navega a la carpeta home y clona tu proyecto:

```bash
cd /var/www
mkdir jabon-system
cd jabon-system
git clone TU_URL_DEL_REPOSITORIO .
# Ejemplo: git clone https://github.com/usuario/jabon-app.git .
```

_(Si no usas Git, sube tus carpetas `backend`, `frontend`, `docker-compose.yml` y `nginx.conf` a `/var/www/jabon-system` usando FileZilla)._

### 3.2 Iniciar los Contenedores

Dentro de la carpeta del proyecto en el VPS (`/var/www/jabon-system`), ejecuta:

```bash
docker compose up -d --build
```

- `up`: Levanta los servicios.
- `-d`: En modo "detached" (segundo plano).
- `--build`: Fuerza la construcción de las imágenes.

### 3.3 Verificar el Estado

Comprueba que todo esté corriendo:

```bash
docker compose ps
```

Deberías ver dos contenedores (`frontend` y `backend`) con estado **Up**.

---

## 🌐 4. Acceso y Verificación

Abre tu navegador y entra a:
`http://TU_IP_DEL_VPS`

El sistema debería cargar correctamente.

- **Frontend**: Servido por Nginx en el puerto 80.
- **API**: Nginx redirige automáticamente las peticiones de `/api` al backend.
- **Base de Datos**: Los datos se guardarán en el VPS en `/var/www/jabon-system/backend/db`, asegurando que no pierdas información si reinicias el servidor.

---

## 🔒 5. (Opcional) Configurar Dominio y HTTPS

Para producción real, es vital tener un dominio y HTTPS (candado verde).

1.  **Dominio**: En tu proveedor de dominio (GoDaddy, Namecheap, Hostinger), crea un registro **A** que apunte a la IP de tu VPS.
2.  **HTTPS**: La forma más fácil es usar **Certbot** directamente en el VPS o configurar un contenedor de Nginx Proxy Manager.

Para no complicar la configuración actual de Docker, una opción rápida es ejecutar Certbot en el host y modificar levemente `docker-compose` para montar los certificados, pero para empezar, asegúrate de que **http://TU_IP** funcione perfectamente.

---

## 🆘 Solución de Problemas Comunes

- **Error de Permisos en Base de Datos**: Si el backend falla al guardar datos, ajusta los permisos de la carpeta db en el VPS:
  ```bash
  chmod -R 777 backend/db
  ```
- **Ver logs del backend**:
  ```bash
  docker compose logs -f backend
  ```
- **Reiniciar todo**:
  ```bash
  docker compose down
  docker compose up -d
  ```
