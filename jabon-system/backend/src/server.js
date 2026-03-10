// Cargar variables de entorno solo en producción
// En desarrollo local, usa los valores por defecto del código
if (process.env.NODE_ENV === 'production') {
  require('dotenv').config({ path: '.env.production' });
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const os = require('os');

const productRoutes = require('./routes/productRoutes');
const clientRoutes = require('./routes/clientRoutes');
const saleRoutes = require('./routes/saleRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const stockRoutes = require('./routes/stockRoutes');
const creditRoutes = require('./routes/creditRoutes');
const configRoutes = require('./routes/configRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ===== TRUST PROXY (necesario cuando está detrás de Nginx) =====
// Permite que express-rate-limit identifique correctamente la IP real del cliente
if (NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// ===== MIDDLEWARES DE SEGURIDAD =====

// Helmet: Configurar headers de seguridad HTTP
app.use(helmet({
  contentSecurityPolicy: false, // Desactivar CSP para evitar conflictos con SPA
  crossOriginEmbedderPolicy: false
}));

// Compression: Compresión gzip para respuestas
app.use(compression());

// Logging con Morgan
if (NODE_ENV === 'production') {
  app.use(morgan('combined')); // Formato Apache combinado para producción
} else {
  app.use(morgan('dev')); // Formato simple para desarrollo
}

// Rate Limiting: Limitar requests para prevenir ataques DDoS (solo en producción)
if (NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos por defecto
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Límite de requests
    message: 'Demasiadas peticiones desde esta IP, por favor intenta de nuevo más tarde.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  
  // Aplicar rate limiting a todas las rutas de API
  app.use('/api', limiter);
  console.log('🔒 Rate limiting activado: ' + (process.env.RATE_LIMIT_MAX_REQUESTS || 100) + ' req/15min');
} else {
  console.log('⚠️  Rate limiting desactivado (modo desarrollo)');
}

// CORS: Configuración dinámica según entorno
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
app.use(cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Parseo de JSON y URL-encoded
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rutas
app.use('/api/productos', productRoutes);
app.use('/api/clientes', clientRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/config', configRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/orders', orderRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: '🧼 API de Sistema de Inventario y Ventas - Jabones Líquidos' });
});

// Obtener IP local
const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
};

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  const localIP = getLocalIP();
  console.log(`
╔═══════════════════════════════════════════════════════╗
║ 🧼 Sistema de Inventario y Ventas - Jabones           ║
║                                                       ║
║ ✅ Servidor corriendo en:                             ║
║ • Localhost: http://localhost:${PORT}                    ║
║ • Red Local: http://${localIP}:${PORT}                ║
║                                                       ║
║ 🔒 Configuración de Seguridad:                        ║
║ • Entorno: ${NODE_ENV.toUpperCase().padEnd(42)} ║
║ • CORS: ${allowedOrigin.padEnd(45)} ║
║ • Rate Limit: ${(process.env.RATE_LIMIT_MAX_REQUESTS || 100) + ' req/15min'}                              ║
║                                                       ║
║ Rutas API disponibles:                                ║ 
║ 📦 /api/productos                                     ║
║ 👥 /api/clientes                                      ║
║ 💰 /api/sales                                         ║
║ 💳 /api/credits                                       ║
║ 📊 /api/dashboard                                     ║ 
║ 📋 /api/stock                                         ║     
║ ⚙️ /api/config                                        ║
║ 📈 /api/analytics                                     ║
║ 🛒 /api/orders                                        ║
║                                                       ║    
║            SISTEMA REALIZADO POR: JOSE RUCO           ║
║                                                       ║
║                   PROGRAMMER {JR}                     ║
║                  software solutions                   ║
║                                                       ║  
╚═══════════════════════════════════════════════════════╝
  `);
});
