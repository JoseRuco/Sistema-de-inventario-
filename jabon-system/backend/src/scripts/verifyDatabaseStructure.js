const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../../database_vieja.db');
const db = new Database(dbPath);

console.log('📊 VERIFICANDO ESTRUCTURA DE BASE DE DATOS');
console.log('═'.repeat(60));

// Obtener todas las tablas
const tables = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' 
  ORDER BY name
`).all();

console.log('\n📁 TABLAS EXISTENTES:');
tables.forEach(table => {
  console.log(`\n  ✓ ${table.name}`);
  
  // Obtener columnas de cada tabla
  const columns = db.prepare(`PRAGMA table_info(${table.name})`).all();
  columns.forEach(col => {
    console.log(`    - ${col.name} (${col.type})${col.notnull ? ' NOT NULL' : ''}${col.dflt_value ? ` DEFAULT ${col.dflt_value}` : ''}`);
  });
});

console.log('\n═'.repeat(60));
console.log('✅ Verificación completada\n');

db.close();
