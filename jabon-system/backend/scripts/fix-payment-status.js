const Database = require('better-sqlite3');
const path = require('path');

// Conectar a la base de datos
const dbPath = path.join(__dirname, '../db/database_vieja.db');
const db = new Database(dbPath);

console.log('🔧 Iniciando corrección de estados de pago...');
console.log('📂 Base de datos:', dbPath);
console.log('');

// 1. Buscar ventas con el problema
const ventasProblematicas = db.prepare(`
  SELECT 
    id,
    fecha,
    total,
    monto_pagado,
    monto_pendiente,
    estado_pago,
    cliente_id
  FROM ventas
  WHERE monto_pagado >= total 
    AND estado_pago != 'pagado'
`).all();

console.log(`📊 Ventas encontradas con el problema: ${ventasProblematicas.length}\n`);

if (ventasProblematicas.length === 0) {
    console.log('✅ No hay ventas que corregir. Todo está bien!');
    db.close();
    process.exit(0);
}

// Mostrar las ventas que se van a corregir
console.log('📋 Ventas que serán corregidas:\n');
ventasProblematicas.forEach((venta, index) => {
    console.log(`${index + 1}. Venta ID: ${venta.id}`);
    console.log(`   Fecha: ${venta.fecha}`);
    console.log(`   Total: $${venta.total.toLocaleString()}`);
    console.log(`   Monto Pagado: $${venta.monto_pagado.toLocaleString()}`);
    console.log(`   Estado Actual: ${venta.estado_pago} ❌`);
    console.log(`   Estado Correcto: pagado ✅`);
    console.log('');
});

// 2. Corregir las ventas
console.log('🔄 Aplicando correcciones...\n');

const updateStmt = db.prepare(`
  UPDATE ventas 
  SET estado_pago = 'pagado',
      monto_pendiente = 0
  WHERE id = ?
`);

let corregidas = 0;

ventasProblematicas.forEach(venta => {
    try {
        updateStmt.run(venta.id);
        corregidas++;
        console.log(`✅ Venta ID ${venta.id} corregida exitosamente`);
    } catch (error) {
        console.error(`❌ Error corrigiendo venta ID ${venta.id}:`, error.message);
    }
});

console.log(`\n✨ Proceso completado!`);
console.log(`📊 Ventas corregidas: ${corregidas} de ${ventasProblematicas.length}`);
console.log(`\n💡 Ahora estas ventas NO aparecerán en "Cuentas por Cobrar"`);

// Verificar el resultado
const verificacion = db.prepare(`
  SELECT COUNT(*) as count
  FROM ventas
  WHERE monto_pagado >= total 
    AND estado_pago != 'pagado'
`).get();

if (verificacion.count === 0) {
    console.log(`✅ Verificación exitosa: No quedan ventas con el problema\n`);
} else {
    console.log(`⚠️ Advertencia: Aún quedan ${verificacion.count} ventas con el problema\n`);
}

db.close();
