const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../database_vieja.db');
const db = new Database(dbPath);

console.log('🔄 Iniciando migración: Sistema de crédito/fiado...');

try {
  db.exec('BEGIN TRANSACTION');

  // 1. Agregar campos a la tabla ventas
  console.log('📝 Agregando campos a tabla ventas...');
  
  // Estado de pago: 'pagado', 'pendiente', 'parcial'
  db.exec(`
    ALTER TABLE ventas ADD COLUMN estado_pago TEXT DEFAULT 'pagado';
  `);
  
  // Monto pagado (para pagos parciales)
  db.exec(`
    ALTER TABLE ventas ADD COLUMN monto_pagado REAL DEFAULT 0;
  `);
  
  // Monto pendiente
  db.exec(`
    ALTER TABLE ventas ADD COLUMN monto_pendiente REAL DEFAULT 0;
  `);

  // 2. Crear tabla de abonos/pagos
  console.log('📝 Creando tabla de abonos...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS abonos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venta_id INTEGER NOT NULL,
      cliente_id INTEGER NOT NULL,
      monto REAL NOT NULL,
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
      metodo_pago TEXT DEFAULT 'efectivo',
      notas TEXT,
      FOREIGN KEY (venta_id) REFERENCES ventas(id),
      FOREIGN KEY (cliente_id) REFERENCES clientes(id)
    );
  `);

  // 3. Crear índices para mejor rendimiento
  console.log('📝 Creando índices...');
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_ventas_estado_pago ON ventas(estado_pago);
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_abonos_venta ON abonos(venta_id);
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_abonos_cliente ON abonos(cliente_id);
  `);

  // 4. Actualizar ventas existentes como pagadas
  console.log('📝 Actualizando ventas existentes...');
  db.exec(`
    UPDATE ventas 
    SET estado_pago = 'pagado', 
        monto_pagado = total, 
        monto_pendiente = 0 
    WHERE estado_pago IS NULL;
  `);

  db.exec('COMMIT');
  console.log('✅ Migración completada exitosamente');

} catch (error) {
  db.exec('ROLLBACK');
  console.error('❌ Error en la migración:', error);
  throw error;
} finally {
  db.close();
}
