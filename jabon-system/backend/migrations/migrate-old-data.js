const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../database_vieja.db');
const db = new Database(dbPath);

console.log('🔄 Migrando datos de detalle_ventas a ventas_detalles...\n');

try {
  db.exec('BEGIN TRANSACTION');

  // 1. Verificar si detalle_ventas existe
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='detalle_ventas'").all();
  
  if (tables.length === 0) {
    console.log('⚠️  La tabla detalle_ventas no existe. No hay nada que migrar.');
    db.close();
    process.exit(0);
  }

  // 2. Contar registros en ambas tablas
  const oldCount = db.prepare("SELECT COUNT(*) as count FROM detalle_ventas").get();
  const newCount = db.prepare("SELECT COUNT(*) as count FROM ventas_detalles").get();
  
  console.log(`📊 Registros en detalle_ventas (vieja): ${oldCount.count}`);
  console.log(`📊 Registros en ventas_detalles (nueva): ${newCount.count}\n`);

  // 3. Migrar datos de detalle_ventas a ventas_detalles
  console.log('🔄 Migrando registros...');
  
  db.exec(`
    INSERT OR IGNORE INTO ventas_detalles (id, venta_id, producto_id, cantidad, precio_unitario, subtotal)
    SELECT id, venta_id, producto_id, cantidad, precio_unitario, subtotal
    FROM detalle_ventas
  `);

  // 4. Verificar migración
  const newCountAfter = db.prepare("SELECT COUNT(*) as count FROM ventas_detalles").get();
  const migrated = newCountAfter.count - newCount.count;
  
  console.log(`✅ Migrados ${migrated} registros`);
  console.log(`📊 Total en ventas_detalles ahora: ${newCountAfter.count}\n`);

  // 5. Actualizar ventas que no tienen los campos nuevos
  console.log('🔄 Actualizando campos faltantes en tabla ventas...');
  
  db.exec(`
    UPDATE ventas 
    SET 
      metodo_pago = COALESCE(metodo_pago, 'efectivo'),
      estado_pago = COALESCE(estado_pago, 'pagado'),
      monto_pagado = COALESCE(monto_pagado, total),
      monto_pendiente = COALESCE(monto_pendiente, 0)
    WHERE metodo_pago IS NULL OR estado_pago IS NULL
  `);

  db.exec('COMMIT');

  console.log('✅ Migración completada exitosamente\n');

  // 6. Mostrar resumen
  console.log('📋 RESUMEN DE TABLAS:');
  const allTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
  allTables.forEach(t => console.log(`   ✓ ${t.name}`));

  console.log('\n💡 RECOMENDACIÓN: Si todo funciona bien, puedes eliminar la tabla detalle_ventas ejecutando:');
  console.log('   node backend/migrations/cleanup-old-table.js\n');

} catch (error) {
  db.exec('ROLLBACK');
  console.error('❌ Error en la migración:', error);
  throw error;
} finally {
  db.close();
}
