const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../../database_vieja.db');
const db = new Database(dbPath);
console.log('✅ Base de datos conectada en:', dbPath);

// Habilitar claves foráneas
db.pragma('foreign_keys = ON');

// Crear tablas si no existen
const initDB = () => {
  // Tabla de productos CON columna activo
  db.exec(`
    CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      tipo TEXT NOT NULL,
      presentacion TEXT NOT NULL,
      precio_costo REAL NOT NULL,
      precio_venta REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      activo INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla de clientes CON columna activo
  db.exec(`
    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      telefono TEXT,
      correo TEXT,
      direccion TEXT,
      activo INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla de ventas
  db.exec(`
    CREATE TABLE IF NOT EXISTS ventas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
      cliente_id INTEGER,
      total REAL NOT NULL,
      FOREIGN KEY (cliente_id) REFERENCES clientes(id)
    )
  `);

  // Tabla de detalle de ventas
  db.exec(`
    CREATE TABLE IF NOT EXISTS detalle_ventas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venta_id INTEGER NOT NULL,
      producto_id INTEGER NOT NULL,
      cantidad INTEGER NOT NULL,
      precio_unitario REAL NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
      FOREIGN KEY (producto_id) REFERENCES productos(id)
    )
  `);

  // Tabla de configuración
  db.exec(`
    CREATE TABLE IF NOT EXISTS configuracion (
      clave TEXT PRIMARY KEY,
      valor TEXT
    )
  `);

  // Insertar configuración por defecto si no existe
  const configCount = db.prepare('SELECT COUNT(*) as count FROM configuracion').get().count;
  if (configCount === 0) {
    const insertConfig = db.prepare('INSERT INTO configuracion (clave, valor) VALUES (?, ?)');
    insertConfig.run('alert_email', 'usuario@ejemplo.com');
    insertConfig.run('alert_subject', 'Alerta: Stock Bajo - {producto}');
    insertConfig.run('alert_message', 'El producto {producto} tiene un stock bajo de {stock} unidades. Por favor reabastecer.');
    insertConfig.run('smtp_host', 'smtp.gmail.com');
    insertConfig.run('smtp_port', '587');
    insertConfig.run('smtp_user', '');
    insertConfig.run('smtp_pass', '');
  }

  console.log('✅ Base de datos inicializada correctamente');
};

initDB();

module.exports = db;
