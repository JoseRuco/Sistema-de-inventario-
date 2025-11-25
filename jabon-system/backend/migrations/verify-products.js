const db = require('./src/config/database');

console.log('\n=== VERIFICACIÓN DE PRODUCTOS ===\n');

// 1. Ver estructura de la tabla
const estructura = db.prepare('PRAGMA table_info(productos)').all();
console.log('✅ Columnas de la tabla productos:');
estructura.forEach(col => {
  console.log(`  - ${col.name} (${col.type})`);
});

// 2. Total de productos
const total = db.prepare('SELECT COUNT(*) as count FROM productos').get();
console.log('\n✅ Total de productos en DB:', total.count);

// 3. Verificar si hay campo "activo"
const hasActivo = estructura.some(col => col.name === 'activo');

if (hasActivo) {
  const activos = db.prepare('SELECT COUNT(*) as count FROM productos WHERE activo = 1').get();
  const inactivos = db.prepare('SELECT COUNT(*) as count FROM productos WHERE activo = 0').get();
  
  console.log('   - Productos activos:', activos.count);
  console.log('   - Productos inactivos:', inactivos.count);
} else {
  console.log('   ⚠️ La tabla NO tiene columna "activo"');
}

// 4. Listar todos los productos
console.log('\n✅ Lista de productos:');
const productos = db.prepare('SELECT * FROM productos').all();
productos.forEach((p, index) => {
  const estado = hasActivo ? (p.activo === 1 ? '✅ Activo' : '❌ Inactivo') : '🔹';
  console.log(`${index + 1}. ${p.nombre} (${p.tipo} - ${p.presentacion}) ${estado}`);
});
