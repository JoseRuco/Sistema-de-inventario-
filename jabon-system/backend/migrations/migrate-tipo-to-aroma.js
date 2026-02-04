const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH 
  ? path.resolve(__dirname, '../', process.env.DB_PATH) 
  : path.resolve(__dirname, '../db/DataBase.db');

console.log('📦 Iniciando migración: tipo → aroma');
console.log('📂 Base de datos:', dbPath);

const db = new Database(dbPath);

try {
  console.log('\n🔍 Verificando estructura actual...');
  
  // Verificar si la columna 'tipo' existe
  const tableInfo = db.prepare("PRAGMA table_info(productos)").all();
  const hasTipo = tableInfo.some(col => col.name === 'tipo');
  const hasAroma = tableInfo.some(col => col.name === 'aroma');
  
  if (hasAroma && !hasTipo) {
    console.log('✅ La migración ya fue aplicada anteriormente');
    console.log('   La columna "aroma" ya existe y "tipo" no existe');
    process.exit(0);
  }
  
  if (!hasTipo) {
    console.log('❌ Error: La columna "tipo" no existe en la tabla productos');
    process.exit(1);
  }
  
  console.log('✅ Columna "tipo" encontrada');
  
  // Contar productos actuales
  const productCount = db.prepare('SELECT COUNT(*) as count FROM productos').get().count;
  console.log(`📊 Productos en la base de datos: ${productCount}`);
  
  console.log('\n🔄 Iniciando migración...');
  
  // SQLite no soporta RENAME COLUMN directamente en versiones antiguas
  // Usaremos el método de recrear la tabla
  
  // Deshabilitar foreign keys temporalmente
  db.pragma('foreign_keys = OFF');
  
  db.exec('BEGIN TRANSACTION');
  
  // 1. Crear tabla temporal con la nueva estructura
  console.log('1️⃣  Creando tabla temporal...');
  db.exec(`
    CREATE TABLE productos_new (
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
  
  // 2. Copiar datos de la tabla original a la nueva
  console.log('2️⃣  Copiando datos...');
  db.exec(`
    INSERT INTO productos_new (id, nombre, aroma, presentacion, precio_costo, precio_venta, stock, activo, created_at)
    SELECT id, nombre, tipo, presentacion, precio_costo, precio_venta, stock, activo, created_at
    FROM productos
  `);
  
  // 3. Eliminar tabla original
  console.log('3️⃣  Eliminando tabla original...');
  db.exec('DROP TABLE productos');
  
  // 4. Renombrar tabla nueva
  console.log('4️⃣  Renombrando tabla nueva...');
  db.exec('ALTER TABLE productos_new RENAME TO productos');
  
  // 5. Recrear índices si existían
  console.log('5️⃣  Recreando índices...');
  // No hay índices específicos en la tabla productos según el schema actual
  
  db.exec('COMMIT');
  
  // Rehabilitar foreign keys
  db.pragma('foreign_keys = ON');
  
  console.log('\n✅ Migración completada exitosamente');
  
  // Verificar resultado
  const newTableInfo = db.prepare("PRAGMA table_info(productos)").all();
  const hasAromaAfter = newTableInfo.some(col => col.name === 'aroma');
  const hasTipoAfter = newTableInfo.some(col => col.name === 'tipo');
  
  console.log('\n📋 Verificación final:');
  console.log(`   ✅ Columna "aroma" existe: ${hasAromaAfter}`);
  console.log(`   ✅ Columna "tipo" eliminada: ${!hasTipoAfter}`);
  
  const finalCount = db.prepare('SELECT COUNT(*) as count FROM productos').get().count;
  console.log(`   ✅ Productos migrados: ${finalCount}/${productCount}`);
  
  if (finalCount !== productCount) {
    throw new Error('¡Advertencia! El número de productos no coincide');
  }
  
  console.log('\n🎉 Migración completada sin errores');
  
} catch (error) {
  console.error('\n❌ Error durante la migración:', error.message);
  console.log('🔄 Intentando revertir cambios...');
  
  try {
    db.exec('ROLLBACK');
    console.log('✅ Cambios revertidos exitosamente');
  } catch (rollbackError) {
    console.error('❌ Error al revertir:', rollbackError.message);
  }
  
  process.exit(1);
} finally {
  db.close();
}
