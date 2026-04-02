const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH 
  ? path.resolve(__dirname, '../../', process.env.DB_PATH) 
  : path.resolve(__dirname, '../../db/DataBase.db');

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
      aroma TEXT NOT NULL,
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

  // Tabla de compras (Registro de facturas de compra)
  db.exec(`
    CREATE TABLE IF NOT EXISTS compras (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero_factura TEXT UNIQUE NOT NULL,
      fecha TEXT NOT NULL,
      proveedor TEXT NOT NULL,
      total REAL NOT NULL DEFAULT 0,
      imagen_url TEXT NOT NULL,
      notas TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla de detalles de compras
  db.exec(`
    CREATE TABLE IF NOT EXISTS compras_detalles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      compra_id INTEGER NOT NULL,
      nombre_insumo TEXT NOT NULL,
      cantidad REAL NOT NULL,
      precio_unitario REAL NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (compra_id) REFERENCES compras(id)
    )
  `);

  // Insertar configuración por defecto si no existe
  const configCount = db.prepare('SELECT COUNT(*) as count FROM configuracion').get().count;
  if (configCount === 0) {
    const insertConfig = db.prepare('INSERT INTO configuracion (clave, valor) VALUES (?, ?)');
    insertConfig.run('alert_email', 'usuario@ejemplo.com');
    insertConfig.run('alert_subject', 'Alerta: Stock Bajo - {producto} ({aroma} - {presentacion})');
    insertConfig.run('alert_message', 'El producto {producto} (Aroma: {aroma}, Presentación: {presentacion}) ha alcanzado un stock bajo de {stock} unidades.');
    insertConfig.run('smtp_host', 'smtp.gmail.com');
    insertConfig.run('smtp_port', '587');
    insertConfig.run('smtp_user', '');
    insertConfig.run('smtp_pass', '');
  }

  // ✅ CREAR CLIENTE GENERAL POR DEFECTO (ID = 1)
  try {
    const generalClient = db.prepare('SELECT id FROM clientes WHERE id = 1').get();
    
    if (!generalClient) {
      console.log('🔧 Creando Cliente General...');
      // Insertar con ID específico = 1
      db.prepare(`
        INSERT INTO clientes (id, nombre, telefono, correo, direccion, activo)
        VALUES (1, 'Cliente General', '', '', 'Sin dirección registrada', 1)
      `).run();
      console.log('✅ Cliente General creado con ID = 1');
    } else {
      console.log('✅ Cliente General ya existe (ID = 1)');
    }
  } catch (error) {
    console.error('❌ Error verificando/creando Cliente General:', error);
  }

  // --- MIGRACIONES ---
  try {
    // --- MIGRACIONES DE PRODUCTOS ---
    const tableInfoProd = db.prepare("PRAGMA table_info(productos)").all();
    const columnsProd = tableInfoProd.map(col => col.name);

    // ✅ MIGRACIÓN: Eliminar columna legada 'tipo' que causa NOT NULL constraint error
    // En versiones antiguas se usaba 'tipo', ahora se usa nombre+aroma+presentacion
    if (columnsProd.includes('tipo')) {
      console.log('🔧 Migrando tabla productos: eliminando columna tipo (legacy)...');
      try {
        db.pragma('foreign_keys = OFF');
        db.exec(`
          BEGIN TRANSACTION;
          
          CREATE TABLE IF NOT EXISTS productos_nueva (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            aroma TEXT NOT NULL DEFAULT '',
            presentacion TEXT NOT NULL DEFAULT '',
            precio_costo REAL NOT NULL,
            precio_venta REAL NOT NULL,
            stock INTEGER NOT NULL DEFAULT 0,
            activo INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          INSERT INTO productos_nueva (id, nombre, aroma, presentacion, precio_costo, precio_venta, stock, activo, created_at)
          SELECT 
            id,
            COALESCE(nombre, tipo, '') as nombre,
            COALESCE(aroma, '') as aroma,
            COALESCE(presentacion, '') as presentacion,
            precio_costo,
            precio_venta,
            stock,
            COALESCE(activo, 1),
            created_at
          FROM productos;

          DROP TABLE productos;
          ALTER TABLE productos_nueva RENAME TO productos;

          COMMIT;
        `);
      } finally {
        // Aseguramos que se vuelva a activar en cualquier caso
        db.pragma('foreign_keys = ON');
      }
      console.log('✅ Tabla productos migrada correctamente (columna tipo eliminada)');
    }

    // Refrescar info de columnas tras posible migración
    const tableInfoProdFresh = db.prepare("PRAGMA table_info(productos)").all();
    const columnsProdFresh = tableInfoProdFresh.map(col => col.name);

    if (!columnsProdFresh.includes('aroma')) {
      db.exec("ALTER TABLE productos ADD COLUMN aroma TEXT NOT NULL DEFAULT ''");
      console.log('✅ Columna aroma añadida a la tabla productos');
    }
    if (!columnsProdFresh.includes('presentacion')) {
      db.exec("ALTER TABLE productos ADD COLUMN presentacion TEXT NOT NULL DEFAULT ''");
      console.log('✅ Columna presentacion añadida a la tabla productos');
    }
    if (!columnsProdFresh.includes('activo')) {
      db.exec("ALTER TABLE productos ADD COLUMN activo INTEGER DEFAULT 1");
      console.log('✅ Columna activo añadida a la tabla productos');
    }

    // --- MIGRACIONES DE CLIENTES ---
    const tableInfoCli = db.prepare("PRAGMA table_info(clientes)").all();
    const columnsCli = tableInfoCli.map(col => col.name);
    if (!columnsCli.includes('activo')) {
      db.exec("ALTER TABLE clientes ADD COLUMN activo INTEGER DEFAULT 1");
      console.log('✅ Columna activo añadida a la clientes');
    }

    // --- MIGRACIONES DE VENTAS ---
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

    // --- MIGRACIONES DE PEDIDOS ---
    const tableInfoPedidos = db.prepare("PRAGMA table_info(pedidos)").all();
    const hasNotasPedidos = tableInfoPedidos.some(col => col.name === 'notas');
    if (!hasNotasPedidos) {
      db.exec('ALTER TABLE pedidos ADD COLUMN notas TEXT');
      console.log('✅ Columna notas añadida a la tabla pedidos');
    }

    // --- MIGRACIONES DE CONFIGURACIÓN ---
    console.log('🔧 Verificando configuración de alertas...');
    const currentSubject = db.prepare("SELECT valor FROM configuracion WHERE clave = 'alert_subject'").get();
    const currentMessage = db.prepare("SELECT valor FROM configuracion WHERE clave = 'alert_message'").get();

    if (currentSubject && !currentSubject.valor.includes('{aroma}')) {
      db.prepare("UPDATE configuracion SET valor = 'Alerta: Stock Bajo - {producto} ({aroma} - {presentacion})' WHERE clave = 'alert_subject'").run();
      console.log('✅ Subject de alerta actualizado');
    }

    if (currentMessage && !currentMessage.valor.includes('{aroma}')) {
      db.prepare("UPDATE configuracion SET valor = 'El producto {producto} (Aroma: {aroma}, Presentación: {presentacion}) ha alcanzado un stock bajo de {stock} unidades.' WHERE clave = 'alert_message'").run();
      console.log('✅ Mensaje de alerta actualizado');
    }

    // --- OPTIMIZACIÓN: Índices ---
    console.log('🔍 Verificando índices...');
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha);
      CREATE INDEX IF NOT EXISTS idx_ventas_cliente ON ventas(cliente_id);
      CREATE INDEX IF NOT EXISTS idx_ventas_estado ON ventas(estado_pago);
      CREATE INDEX IF NOT EXISTS idx_ventas_metodo ON ventas(metodo_pago);
      CREATE INDEX IF NOT EXISTS idx_compras_fecha ON compras(fecha);
      CREATE INDEX IF NOT EXISTS idx_compras_proveedor ON compras(proveedor);
      CREATE INDEX IF NOT EXISTS idx_compras_numero ON compras(numero_factura);
    `);
    console.log('✅ Índices verificados/creados');

  } catch (error) {
    console.error('Error verificando/añadiendo columnas:', error);
  }

  console.log('✅ Base de datos inicializada correctamente');
};

initDB();

module.exports = db;
