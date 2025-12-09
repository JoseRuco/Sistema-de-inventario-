---
description: Documentación completa de la implementación de Docker y guía de despliegue en Hostinger VPS usando Docker.
---

# Implementación de Docker y Guía de Despliegue

Esta documentación se divide en dos partes:

1.  **Explicación técnica (Cómo funciona)**: Qué archivos creamos y por qué.
2.  **Guía de Despliegue (Paso a Paso)**: Cómo subir esto a Hostinger usando Docker.

---

## PARTE 1: La Arquitectura Docker Implementada

Hemos creado un entorno de contenedores que empaqueta toda tu aplicación. Ya no dependes de instalar versiones específicas de Node.js o Nginx en el servidor.

### Los Archivos Creados:

#### 1. `frontend/Dockerfile` (El Contenedor del Cliente)

Este archivo usa **construcción en etapas (Multi-stage build)** para ser ultra ligero:

- **Etapa 1 (Builder)**: Usa una imagen de Node.js completa para descargar dependencias y compilar tu proyecto (`npm run build`). Genera la carpeta `dist`.
- **Etapa 2 (Production)**: Usa una imagen **Nginx Alpine** (muy liviana, ~20MB). Solo copia la carpeta `dist` generada en la etapa 1.
- **Resultado**: Un contenedor final que solo tiene lo necesario para servir tu web, sin código fuente ni herramientas de desarrollo innecesarias.

#### 2. `backend/Dockerfile` (El Contenedor del Servidor)

- Usa `node:20-alpine`, una versión ligera de Linux.
- Instala `python3` y `make` temporalmente porque `better-sqlite3` necesita compilarse.
- Copia solo lo necesario y expone el puerto 3000.
- Crea un volumen para `/app/data` para que tu base de datos SQLite no se borre si reinicias el contenedor.

#### 3. `nginx.conf` (El Policía de Tráfico)

Configuramos Nginx para que actúe como intermediario inteligente:

- Si el usuario pide `/` (la web), le entrega los archivos de React.
- Si el usuario pide `/api/...`, redirige silenciosamente la petición al contenedor `backend`.
- **Ventaja**: Evita problemas de CORS y simplifica la seguridad.

#### 4. `docker-compose.yml` (El Director de Orquesta)

Este archivo conecta todo:

- Define dos servicios: `frontend` y `backend`.
- Crea una red privada (`app-network`) para que se comuniquen entre ellos.
- Mapea los volúmenes para que los datos sean persistentes.
- Con un solo comando (`docker compose up`), levanta todo el sistema.

---

## PARTE 2: Guía de Despliegue en Hostinger VPS (Guía Docker)

Sigue estos pasos para subir tu proyecto dockerizado a producción.

### FASE A: Subir Cambios a GitHub

Primero, asegura que los nuevos archivos Docker estén en tu repositorio.

en tu PC local:

```bash
git add .
git commit -m "Implementación de arquitectura Docker"
git push origin master
```

### FASE B: Configurar el VPS (Hostinger)

1.  **Compra el VPS**: (Igual que en la guía anterior, Plan KVM 1 con Ubuntu 22.04).
2.  **Conéctate por SSH**: `ssh root@TU_IP`

#### 1. Instalar Docker en el VPS

Copia y pega este bloque completo en la terminal de tu servidor:

```bash
# Actualizar repositorios
apt update

# Instalar requisitos previos
apt install -y apt-transport-https ca-certificates curl software-properties-common

# Añadir clave GPG oficial de Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Añadir repositorio de Docker
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io

# Instalar Docker Compose (versión plugin, lo moderno)
apt install -y docker-compose-plugin

# Verificar instalación (debe decir "Active: active (running)")
systemctl status docker
```

_(Presiona `q` para salir del mensaje de estado)_

#### 2. Clonar y Desplegar

Ahora viene la magia. Solo necesitamos el código y Docker hará el resto.

```bash
# Crear carpeta
mkdir -p /var/www/jabon-app
cd /var/www/jabon-app

# Clonar repo (Reemplaza con TU URL)
git clone https://github.com/Josuruco/sistema-inventario.git .

# --- DESPLIEGUE ---
# Este comando construye las imágenes y levanta los servicios en 2do plano
docker compose up -d --build
```

¡Listo! Si vas a `http://TU_IP` verás tu aplicación funcionando.
Docker se encargó de instalar Node, Nginx, compilar el frontend y configurar el backend por ti.

---

### FASE C: Configurar HTTPS (El Candado Verde) con Docker

Para tener HTTPS (necesario para la PWA) con Docker, usaremos un contenedor extra llamado **Nginx Proxy Manager** o configuraremos Certbot manualmente.
**Opción más sencilla para empezar (Certbot en el Host):**

Aunque usamos Docker, podemos usar Nginx del propio servidor VPS (fuera de docker) como "puerta de entrada" segura que redirija al Docker.

1. **Instalar Nginx en el HOST (fuera de Docker)**:

```bash
apt install -y nginx
```

2. **Configurar el Proxy**:

```bash
nano /etc/nginx/sites-available/jabon-system
```

Contenido:

```nginx
server {
    listen 80;
    server_name tu-dominio.com; # TU DOMINIO REAL

    location / {
        # Redirige todo al Docker que está escuchando en el puerto 80 del localhost
        # PERO espera... Docker ya usa el puerto 80.
        # TRUCO: Cambiaremos el puerto de Docker a 8080 en el siguiente paso.
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

3. **Ajuste Rápido a `docker-compose.yml`**:
   En el servidor, edita el archivo: `nano docker-compose.yml`
   Cambia:

```yaml
ports:
  - "80:80"
```

Por:

```yaml
ports:
  - "8080:80" # Expone el 80 del contenedor en el 8080 del VPS
```

4. **Reiniciar Docker**:

```bash
docker compose down
docker compose up -d
```

5. **Activar HTTPS con Certbot**:

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d tu-dominio.com
```

**Resumen**:
Internet (HTTPS) -> Nginx Host (SSL) -> Docker (Puerto 8080) -> Tu App.
Es la forma más robusta y estándar de hacerlo.
