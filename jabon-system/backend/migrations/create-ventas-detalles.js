const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../database_vieja.db');
const db = new Database(dbPath);

console.log('🔄 Creando tabla ventas_detalles...');

try {
  db.exec('BEGIN TRANSACTION');

  // Crear tabla ventas_detalles
  console.log('📝 Creando tabla ventas_detalles...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS ventas_detalles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venta_id INTEGER NOT NULL,
      producto_id INTEGER NOT NULL,
      cantidad INTEGER NOT NULL,
      precio_unitario REAL NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (venta_id) REFERENCES ventas(id),
      FOREIGN KEY (producto_id) REFERENCES productos(id)
    );
  `);

  // Crear índices para mejor rendimiento
  console.log('📝 Creando índices...');
  db.exec(`CREATE INDEX IF NOT EXISTS idx_ventas_detalles_venta ON ventas_detalles(venta_id);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_ventas_detalles_producto ON ventas_detalles(producto_id);`);

  db.exec('COMMIT');

  // Verificar que se creó correctamente
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='ventas_detalles'").all();
  
  if (tables.length > 0) {
    console.log('✅ Tabla ventas_detalles creada exitosamente');
    
    // Mostrar estructura de la tabla
    const structure = db.prepare("PRAGMA table_info(ventas_detalles)").all();
    console.log('📋 Estructura de la tabla:');
    structure.forEach(col => {
      console.log(`   - ${col.name} (${col.type})`);
    });
  } else {
    console.log('❌ La tabla no se pudo crear');
  }

} catch (error) {
  db.exec('ROLLBACK');
  console.error('❌ Error en la migración:', error);
  throw error;
} finally {
  db.close();
}
