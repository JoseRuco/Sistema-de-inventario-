const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../../db/database_vacia-3.db');
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

  // Tabla de ventas CON columnas para sistema de créditos
  db.exec(`
    CREATE TABLE IF NOT EXISTS ventas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
      cliente_id INTEGER,
      total REAL NOT NULL,
      estado_pago TEXT DEFAULT 'pagado',
      monto_pagado REAL DEFAULT 0,
      monto_pendiente REAL DEFAULT 0,
      metodo_pago TEXT DEFAULT 'efectivo',
      FOREIGN KEY (cliente_id) REFERENCES clientes(id)
    )
  `);

  // Tabla de detalle de ventas (legacy - mantener por compatibilidad)
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

  // Tabla de ventas_detalles (versión actualizada)
  db.exec(`
    CREATE TABLE IF NOT EXISTS ventas_detalles (
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

  // Tabla de abonos para sistema de créditos
  db.exec(`
    CREATE TABLE IF NOT EXISTS abonos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venta_id INTEGER NOT NULL,
      cliente_id INTEGER NOT NULL,
      monto REAL NOT NULL,
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
      metodo_pago TEXT DEFAULT 'efectivo',
      notas TEXT,
      FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
      FOREIGN KEY (cliente_id) REFERENCES clientes(id)
    )
  `);

  // Tabla de movimientos de stock (historial de inventario)
  db.exec(`
    CREATE TABLE IF NOT EXISTS stock_movimientos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      producto_id INTEGER NOT NULL,
      tipo TEXT NOT NULL,
      cantidad INTEGER NOT NULL,
      stock_anterior INTEGER NOT NULL,
      stock_nuevo INTEGER NOT NULL,
      motivo TEXT,
      referencia_tipo TEXT,
      referencia_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (producto_id) REFERENCES productos(id)
    )
  `);

  // Tabla de pedidos (Sistema de encargos)
  db.exec(`
    CREATE TABLE IF NOT EXISTS pedidos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER NOT NULL,
      fecha_entrega DATETIME,
      estado TEXT DEFAULT 'pendiente', -- pendiente, en_camino, entregado, cancelado
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cliente_id) REFERENCES clientes(id)
    )
  `);

  // Tabla de detalles de pedidos
  db.exec(`
    CREATE TABLE IF NOT EXISTS pedidos_detalles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id INTEGER NOT NULL,
      producto_id INTEGER NOT NULL,
      cantidad INTEGER NOT NULL,
      FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
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

  // Añadir columna descuento si no existe
  try {
    const tableInfo = db.prepare("PRAGMA table_info(ventas)").all();
    const hasDescuento = tableInfo.some(col => col.name === 'descuento');
    
    if (!hasDescuento) {
      db.exec('ALTER TABLE ventas ADD COLUMN descuento REAL DEFAULT 0');
      console.log('✅ Columna descuento añadida a la tabla ventas');
    }

    // Añadir columna notas si no existe en ventas
    const hasNotas = tableInfo.some(col => col.name === 'notas');
    if (!hasNotas) {
      db.exec('ALTER TABLE ventas ADD COLUMN notas TEXT');
      console.log('✅ Columna notas añadida a la tabla ventas');
    }

    // Añadir columna notas a pedidos si no existe
    const tableInfoPedidos = db.prepare("PRAGMA table_info(pedidos)").all();
    const hasNotasPedidos = tableInfoPedidos.some(col => col.name === 'notas'); // SQLite columns are case-insensitive usually but better consistent
    if (!hasNotasPedidos) {
      db.exec('ALTER TABLE pedidos ADD COLUMN notas TEXT');
      console.log('✅ Columna notas añadida a la tabla pedidos');
    }

    // --- OPTIMIZACIÓN: Índices ---
    console.log('🔍 Verificando índices...');
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha);
      CREATE INDEX IF NOT EXISTS idx_ventas_cliente ON ventas(cliente_id);
      CREATE INDEX IF NOT EXISTS idx_ventas_estado ON ventas(estado_pago);
      CREATE INDEX IF NOT EXISTS idx_ventas_metodo ON ventas(metodo_pago);
    `);
    console.log('✅ Índices verificados/creados');

  } catch (error) {
    console.error('Error verificando/añadiendo columnas:', error);
  }

  console.log('✅ Base de datos inicializada correctamente');
};

initDB();

module.exports = db;
