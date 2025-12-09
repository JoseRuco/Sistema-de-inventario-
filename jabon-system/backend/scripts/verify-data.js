const db = require('../src/config/database');

console.log('\n=== VERIFICACIÓN DE DATOS ===\n');

// 1. Verificar productos
const productos = db.prepare('SELECT COUNT(*) as count FROM productos').get();
console.log('✅ Total productos:', productos.count);

// 2. Verificar ventas
const ventas = db.prepare('SELECT * FROM ventas LIMIT 5').all();
console.log('\n✅ Primeras 5 ventas:');
ventas.forEach(v => {
  console.log({
    id: v.id,
    total: v.total,
    monto_pagado: v.monto_pagado,
    monto_pendiente: v.monto_pendiente,
    estado_pago: v.estado_pago
  });
});

// 3. Total real de ventas
const totalReal = db.prepare('SELECT SUM(total) as total FROM ventas').get();
console.log('\n✅ Total REAL de todas las ventas:', totalReal.total);

// 4. Total de monto_pagado
const totalPagado = db.prepare('SELECT SUM(monto_pagado) as total FROM ventas').get();
console.log('✅ Total MONTO_PAGADO:', totalPagado.total);

// 5. Verificar estructura de tabla
console.log('\n✅ Estructura de tabla ventas:');
const estructura = db.prepare('PRAGMA table_info(ventas)').all();
estructura.forEach(col => {
  console.log(`  - ${col.name} (${col.type})`);
});
