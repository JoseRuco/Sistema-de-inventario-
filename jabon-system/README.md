# 🧼 Sistema de Inventario y Ventas - Jabones

Sistema completo de gestión de inventario, ventas, clientes y análisis de negocio desarrollado con Node.js, Express, SQLite y React.

![Node.js](https://img.shields.io/badge/Node.js-v20-green)
![React](https://img.shields.io/badge/React-v18-blue)
![Docker](https://img.shields.io/badge/Docker-ready-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 🚀 Características Principales

### 📦 Gestión de Inventario

- ✅ CRUD completo de productos (nombre, tipo, presentación, precios)
- ✅ Control de stock con alertas de bajo inventario
- ✅ Historial de movimientos de inventario
- ✅ Productos con múltiples presentaciones

### 💰 Sistema de Ventas

- ✅ Registro de ventas con múltiples productos
- ✅ Sistema de créditos y cuentas por cobrar
- ✅ Registro de abonos parciales
- ✅ Historial completo de ventas
- ✅ Filtros avanzados (fecha, cliente, método de pago)
- ✅ Descuentos y notas por venta

### 👥 Gestión de Clientes

- ✅ CRUD de clientes con información completa
- ✅ Historial de compras por cliente
- ✅ Estado de deudas y créditos
- ✅ Análisis de mejores clientes

### 🛒 Sistema de Pedidos

- ✅ Gestión de encargos/pedidos
- ✅ Control de estado (pendiente, en camino, entregado, cancelado)
- ✅ Fechas de entrega programadas
- ✅ Notas por pedido

### 📊 Dashboard y Reportes

- ✅ Métricas en tiempo real (ventas del mes, total histórico)
- ✅ Gráficas de ventas por tipo de producto
- ✅ Reportes por rango de fechas
- ✅ Top productos más vendidos
- ✅ Análisis de rentabilidad

### 📈 Analytics de Negocio

- ✅ Mejores clientes por volumen de compra
- ✅ Productos de baja rotación
- ✅ Dinero inmovilizado en inventario
- ✅ Márgenes de ganancia por categoría
- ✅ Predicción de ventas

### 🔒 Seguridad

- ✅ Helmet.js para headers de seguridad HTTP
- ✅ Rate limiting para prevención de DDoS
- ✅ CORS configurable por entorno
- ✅ Variables de entorno para datos sensibles
- ✅ Contenedores Docker con usuario no-root

---

## 🛠️ Tecnologías Utilizadas

### Backend

- **Node.js** v20 + **Express** - API RESTful
- **SQLite** con **better-sqlite3** - Base de datos
- **Helmet** - Headers de seguridad HTTP
- **express-rate-limit** - Protección contra DDoS
- **Morgan** - Logging de requests
- **Compression** - Compresión gzip
- **Nodemailer** - Envío de alertas por correo

### Frontend

- **React** v18 - Interfaz de usuario
- **Vite** - Build tool ultra-rápido
- **Axios** - Cliente HTTP
- **Recharts** - Gráficas y visualizaciones
- **Lucide React** - Iconos
- **Tailwind CSS** - Estilos

### DevOps & Deployment

- **Docker** & **Docker Compose** - Containerización
- **Nginx** - Reverse proxy y servidor web
- **Certbot** - Certificados SSL/TLS
- **UFW** - Firewall

---

## 📋 Requisitos

- **Node.js** v18 o superior
- **Docker** y **Docker Compose** (para deployment)
- **Git** (opcional, para clonar el repositorio)

---

## 🚀 Inicio Rápido

### Desarrollo Local

#### 1. Clonar el repositorio

```bash
git clone https://github.com/tuusuario/jabon-system.git
cd jabon-system
```

#### 2. Configurar Backend

```bash
cd backend
npm install
npm run dev
```

El servidor iniciará en: `http://localhost:5000`

#### 3. Configurar Frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

El frontend iniciará en: `http://localhost:5173`

---

### Deployment con Docker (Producción)

Para desplegar el sistema completo en un VPS con Docker, sigue la **[Guía Completa de Despliegue](./GUIA_DESPLIEGUE_DOCKER.md)**.

**Inicio rápido:**

```bash
# 1. Configurar variables de entorno
cd backend
cp .env.example .env.production
nano .env.production  # Editar con tus valores

# 2. Levantar todos los servicios
cd ..
docker compose up -d --build
```

Accede a: `http://localhost`

---

## 📁 Estructura del Proyecto

```
jabon-system/
├── backend/                 # API Node.js/Express
│   ├── src/
│   │   ├── config/         # Configuración de BD
│   │   ├── controllers/    # Lógica de negocio
│   │   ├── routes/         # Rutas de la API
│   │   ├── services/       # Servicios (email, etc.)
│   │   └── server.js       # Entry point
│   ├── db/                 # Base de datos SQLite
│   ├── .env.production     # Variables de entorno
│   └── Dockerfile
│
├── frontend/               # App React/Vite
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── services/      # API client (axios)
│   │   └── App.jsx
│   ├── public/            # Assets estáticos
│   └── Dockerfile
│
├── scripts/
│   ├── backup.sh          # Script de backups automáticos
│   └── deploy.sh          # Script de despliegue
│
├── docker-compose.yml     # Orquestación de servicios
├── nginx.conf            # Configuración Nginx
└── GUIA_DESPLIEGUE_DOCKER.md  # Guía completa
```

---

## 🔐 Configuración de Seguridad

### Variables de Entorno

Crea `backend/.env.production` con:

```env
PORT=3000
NODE_ENV=production
ALLOWED_ORIGIN=https://tudominio.com
RATE_LIMIT_MAX_REQUESTS=100
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-contraseña-app
ALERT_EMAIL=destinatario@ejemplo.com
```

Ver `backend/.env.example` para todas las opciones.

### Características de Seguridad

- ✅ **Helmet.js**: Headers HTTP seguros (X-Frame-Options, CSP, etc.)
- ✅ **Rate Limiting**: Máximo 100 requests/15min por IP
- ✅ **CORS**: Restringido a dominio específico en producción
- ✅ **Docker**: Contenedores con usuario no-root
- ✅ **Nginx**: Headers adicionales de seguridad
- ✅ **SSL/TLS**: Certificados gratuitos con Let's Encrypt

---

## 📦 Scripts Disponibles

### Backend

```bash
npm start       # Producción
npm run dev     # Desarrollo con nodemon
```

### Frontend

```bash
npm run dev     # Servidor de desarrollo
npm run build   # Build para producción
npm run preview # Preview del build
```

### Docker

```bash
docker compose up -d          # Iniciar servicios
docker compose down           # Detener servicios
docker compose logs -f        # Ver logs en tiempo real
docker compose ps             # Ver estado
```

### Utilidades

```bash
bash scripts/backup.sh        # Crear backup de BD
bash scripts/deploy.sh        # Menú de deployment
```

---

## 💾 Sistema de Backups

El sistema incluye backups automáticos de la base de datos:

- **Script**: `scripts/backup.sh`
- **Frecuencia**: Configurable via cron (diario por defecto)
- **Retención**: 30 días
- **Ubicación**: `/var/www/jabon-system/backups/`
- **Formato**: Comprimido con gzip

```bash
# Backup manual
bash scripts/backup.sh

# Configurar backup automático (crontab)
0 2 * * * /var/www/jabon-system/scripts/backup.sh >> /var/log/backup.log 2>&1
```

---

## 🔧 API Endpoints

### Productos

- `GET /api/productos` - Listar todos
- `GET /api/productos/:id` - Obtener uno
- `POST /api/productos` - Crear
- `PUT /api/productos/:id` - Actualizar
- `DELETE /api/productos/:id` - Eliminar

### Ventas

- `GET /api/sales` - Listar con filtros
- `POST /api/sales` - Crear venta
- `GET /api/sales/:id` - Detalles de venta

### Clientes

- `GET /api/clientes` - Listar todos
- `POST /api/clientes` - Crear cliente
- `GET /api/clientes/:id/history` - Historial de compras

### Dashboard

- `GET /api/dashboard/stats` - Estadísticas generales
- `GET /api/dashboard/charts` - Datos para gráficas
- `GET /api/dashboard/reports` - Reportes por fecha

Ver código fuente para endpoints completos.

---

## 🐛 Solución de Problemas

### Error: CORS

Verifica que `ALLOWED_ORIGIN` en `.env.production` coincida con tu dominio.

### Error: Base de datos bloqueada

```bash
chmod -R 777 backend/db
docker compose restart backend
```

### Error: Contenedor no inicia

```bash
docker compose logs backend
docker compose logs frontend
```

Ver más en: [GUIA_DESPLIEGUE_DOCKER.md - Sección 8](./GUIA_DESPLIEGUE_DOCKER.md#-8-solución-de-problemas-comunes)

---

## 📊 Monitoreo

### Ver estado de contenedores

```bash
docker compose ps
docker stats
```

### Ver logs

```bash
docker compose logs -f backend
docker compose logs -f frontend
```

### Health checks

Los contenedores incluyen health checks automáticos:

- **Backend**: Verifica respuesta HTTP en puerto 3000
- **Frontend**: Verifica respuesta Nginx en puerto 80

---

## 🤝 Contribución

Este es un proyecto privado para uso interno. Si tienes acceso y deseas contribuir:

1. Crea una rama desde `main`
2. Haz tus cambios
3. Crea un Pull Request

---

## 📝 Licencia

Todos los derechos reservados © 2025

**Desarrollado por: JOSE RUCO**  
**PROGRAMMER {JR}** - Software Solutions

---

## 📞 Soporte

Para soporte técnico o consultas:

- **Documentación completa**: [GUIA_DESPLIEGUE_DOCKER.md](./GUIA_DESPLIEGUE_DOCKER.md)
- **Logs del sistema**: `docker compose logs`
- **Backups**: `/var/www/jabon-system/backups/`

---

## ✨ Roadmap Futuro

- [ ] Autenticación multi-usuario
- [ ] Exportación de reportes a PDF/Excel
- [ ] Notificaciones push
- [ ] App móvil nativa
- [ ] Integración con pasarelas de pago
- [ ] Multi-tienda

---

_Última actualización: Enero 2026_
