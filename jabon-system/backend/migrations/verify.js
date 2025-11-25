const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'database.db'));

console.log('🔍 Verificando estructura de la base de datos...\n');

// Verificar tabla productos
console.log('📦 Tabla PRODUCTOS:');
const productsInfo = db.prepare("PRAGMA table_info(productos)").all();
productsInfo.forEach(col => {
  console.log(`  - ${col.name} (${col.type})`);
});

console.log('\n👥 Tabla CLIENTES:');
const clientsInfo = db.prepare("PRAGMA table_info(clientes)").all();
clientsInfo.forEach(col => {
  console.log(`  - ${col.name} (${col.type})`);
});

// Probar consulta de productos
console.log('\n🧪 Probando consulta de productos...');
try {
  const products = db.prepare('SELECT * FROM productos WHERE activo = 1').all();
  console.log(`✅ Consulta exitosa. ${products.length} productos activos encontrados`);
} catch (error) {
  console.error('❌ Error en consulta productos:', error.message);
}

// Probar consulta de clientes
console.log('\n🧪 Probando consulta de clientes...');
try {
  const clients = db.prepare('SELECT * FROM clientes WHERE activo = 1').all();
  console.log(`✅ Consulta exitosa. ${clients.length} clientes activos encontrados`);
} catch (error) {
  console.error('❌ Error en consulta clientes:', error.message);
}

db.close();
console.log('\n✅ Verificación completada');