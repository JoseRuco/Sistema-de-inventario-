const Database = require('better-sqlite3');
const db = new Database('../db/database_vieja.db');

console.log('\n=== VERIFICANDO TOTALES ===\n');

// 1. Total de VENTAS (lo que muestra el historial)
const ventasTotales = db.prepare(`
  SELECT 
    COUNT(*) as num_ventas,
    COALESCE(SUM(total), 0) as sum_total,
    COALESCE(SUM(monto_pagado), 0) as sum_monto_pagado
  FROM ventas
  WHERE monto_pagado >= total
`).get();

console.log('1. TOTALES DE TABLA VENTAS:');
console.log('   Número de ventas:', ventasTotales.num_ventas);
console.log('   SUM(total):', ventasTotales.sum_total);
console.log('   SUM(monto_pagado):', ventasTotales.sum_monto_pagado);

// 2. Total de SUBTOTALES (ventas_detalles)
const subtotales = db.prepare(`
  SELECT 
    COALESCE(SUM(vd.subtotal), 0) as sum_subtotales
  FROM ventas_detalles vd
  INNER JOIN ventas v ON vd.venta_id = v.id
  WHERE v.monto_pagado >= v.total
`).get();

console.log('\n2. TOTALES DE VENTAS_DETALLES:');
console.log('   SUM(subtotal):', subtotales.sum_subtotales);

// 3. Diferencia
const diferencia = ventasTotales.sum_monto_pagado - subtotales.sum_subtotales;
console.log('\n3. DIFERENCIA:');
console.log('   v.monto_pagado - vd.subtotal =', diferencia);

// 4. Ver algunas ventas de ejemplo
const ejemplos = db.prepare(`
  SELECT 
    v.id,
    v.total as venta_total,
    v.monto_pagado,
    (SELECT SUM(subtotal) FROM ventas_detalles WHERE venta_id = v.id) as sum_detalles
  FROM ventas v
  WHERE v.monto_pagado >= v.total
  LIMIT 5
`).all();

console.log('\n4. EJEMPLOS DE VENTAS:');
ejemplos.forEach(v => {
  console.log(`   Venta #${v.id}:`);
  console.log(`     total: ${v.venta_total}, pagado: ${v.monto_pagado}, sum_detalles: ${v.sum_detalles}`);
  if (v.venta_total !== v.sum_detalles) {
    console.log(`     ⚠️ DIFERENCIA: total (${v.venta_total}) ≠ sum_detalles (${v.sum_detalles})`);
  }
});

db.close();
