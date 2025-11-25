const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../database_vieja.db');
const db = new Database(dbPath);

console.log('🔄 Actualizando tabla ventas...');

try {
  // Verificar columnas actuales
  const tableInfo = db.prepare("PRAGMA table_info(ventas)").all();
  const columnNames = tableInfo.map(col => col.name);
  
  console.log('📋 Columnas actuales:', columnNames);

  db.exec('BEGIN TRANSACTION');

  // Agregar metodo_pago si no existe
  if (!columnNames.includes('metodo_pago')) {
    console.log('➕ Agregando columna: metodo_pago');
    db.exec(`ALTER TABLE ventas ADD COLUMN metodo_pago TEXT DEFAULT 'efectivo';`);
  } else {
    console.log('✅ Columna metodo_pago ya existe');
  }

  // Agregar estado_pago si no existe
  if (!columnNames.includes('estado_pago')) {
    console.log('➕ Agregando columna: estado_pago');
    db.exec(`ALTER TABLE ventas ADD COLUMN estado_pago TEXT DEFAULT 'pagado';`);
  } else {
    console.log('✅ Columna estado_pago ya existe');
  }

  // Agregar monto_pagado si no existe
  if (!columnNames.includes('monto_pagado')) {
    console.log('➕ Agregando columna: monto_pagado');
    db.exec(`ALTER TABLE ventas ADD COLUMN monto_pagado REAL DEFAULT 0;`);
  } else {
    console.log('✅ Columna monto_pagado ya existe');
  }

  // Agregar monto_pendiente si no existe
  if (!columnNames.includes('monto_pendiente')) {
    console.log('➕ Agregando columna: monto_pendiente');
    db.exec(`ALTER TABLE ventas ADD COLUMN monto_pendiente REAL DEFAULT 0;`);
  } else {
    console.log('✅ Columna monto_pendiente ya existe');
  }

  // Actualizar ventas existentes
  console.log('📝 Actualizando ventas existentes...');
  db.exec(`
    UPDATE ventas 
    SET 
      metodo_pago = COALESCE(metodo_pago, 'efectivo'),
      estado_pago = COALESCE(estado_pago, 'pagado'),
      monto_pagado = COALESCE(monto_pagado, total),
      monto_pendiente = COALESCE(monto_pendiente, 0)
    WHERE id > 0;
  `);

  // Crear tabla de abonos si no existe
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

  // Crear índices
  console.log('📝 Creando índices...');
  db.exec(`CREATE INDEX IF NOT EXISTS idx_ventas_estado_pago ON ventas(estado_pago);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_abonos_venta ON abonos(venta_id);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_abonos_cliente ON abonos(cliente_id);`);

  db.exec('COMMIT');

  // Verificar columnas finales
  const finalTableInfo = db.prepare("PRAGMA table_info(ventas)").all();
  const finalColumns = finalTableInfo.map(col => col.name);
  
  console.log('\n✅ Migración completada exitosamente');
  console.log('📋 Columnas finales:', finalColumns);

} catch (error) {
  db.exec('ROLLBACK');
  console.error('❌ Error en la migración:', error);
  throw error;
} finally {
  db.close();
}
