const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'database.db'));

console.log('🔄 Iniciando migración...');

try {
  // Verificar si la columna ya existe en productos
  const productsInfo = db.prepare("PRAGMA table_info(productos)").all();
  const hasActivoProductos = productsInfo.some(col => col.name === 'activo');
  
  if (!hasActivoProductos) {
    db.exec('ALTER TABLE productos ADD COLUMN activo INTEGER DEFAULT 1');
    console.log('✅ Campo "activo" agregado a tabla productos');
  } else {
    console.log('ℹ️  Campo "activo" ya existe en productos');
  }

  // Verificar si la columna ya existe en clientes
  const clientsInfo = db.prepare("PRAGMA table_info(clientes)").all();
  const hasActivoClientes = clientsInfo.some(col => col.name === 'activo');
  
  if (!hasActivoClientes) {
    db.exec('ALTER TABLE clientes ADD COLUMN activo INTEGER DEFAULT 1');
    console.log('✅ Campo "activo" agregado a tabla clientes');
  } else {
    console.log('ℹ️  Campo "activo" ya existe en clientes');
  }

  // Actualizar todos los registros existentes a activo = 1
  db.exec('UPDATE productos SET activo = 1 WHERE activo IS NULL');
  db.exec('UPDATE clientes SET activo = 1 WHERE activo IS NULL');
  
  console.log('✅ Migración completada exitosamente');
  console.log('');
  console.log('🎉 Ahora puedes iniciar el servidor con: npm start');
  
} catch (error) {
  console.error('❌ Error en la migración:', error.message);
} finally {
  db.close();
}