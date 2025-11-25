const express = require('express');
const cors = require('cors');
const os = require('os');

const productRoutes = require('./routes/productRoutes');
const clientRoutes = require('./routes/clientRoutes');
const saleRoutes = require('./routes/saleRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const stockRoutes = require('./routes/stockRoutes');
const creditRoutes = require('./routes/creditRoutes');
const configRoutes = require('./routes/configRoutes');

const app = express();
const PORT = 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/productos', productRoutes);
app.use('/api/clientes', clientRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/config', configRoutes);

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
║ Rutas API disponibles:                                ║ 
║ 📦 /api/productos                                     ║
║ 👥 /api/clientes                                      ║
║ 💰 /api/sales                                         ║
║ 💳 /api/credits                                       ║
║ 📊 /api/dashboard                                     ║ 
║ 📋 /api/stock                                         ║     
║ ⚙️ /api/config                                        ║
║                                                       ║    
║            SISTEMA REALIAZADO POR: JOSE RUCO          ║
║                   PROGRAMMER {JR}                     ║
║                  software solutions                   ║
║                                                       ║  
╚═══════════════════════════════════════════════════════╝
  `);
});
