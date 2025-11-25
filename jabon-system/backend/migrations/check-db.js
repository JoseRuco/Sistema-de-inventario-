const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../database_vieja.db');
const db = new Database(dbPath);

console.log('📊 Verificando database_vieja.db\n');

// Ver todas las tablas
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log('📋 Tablas:');
tables.forEach(t => console.log(`   ✓ ${t.name}`));

// Ver estructura de ventas
console.log('\n📋 Columnas de tabla ventas:');
const ventasColumns = db.prepare("PRAGMA table_info(ventas)").all();
ventasColumns.forEach(col => console.log(`   - ${col.name} (${col.type})`));

// Ver estructura de ventas_detalles
console.log('\n📋 Columnas de tabla ventas_detalles:');
try {
  const detallesColumns = db.prepare("PRAGMA table_info(ventas_detalles)").all();
  if (detallesColumns.length > 0) {
    detallesColumns.forEach(col => console.log(`   - ${col.name} (${col.type})`));
  } else {
    console.log('   ❌ Tabla ventas_detalles NO existe');
  }
} catch (e) {
  console.log('   ❌ Tabla ventas_detalles NO existe');
}

db.close();
