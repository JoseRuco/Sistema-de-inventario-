const db = require('../src/config/database');

console.log('\n🔍 COMPARANDO HISTORIAL VS ANALYTICS:\n');

// 1. Historial de Ventas (SUM de ventas.total de TODAS las ventas pagadas)
const historial = db.prepare(`
  SELECT 
    COUNT(*) as num_ventas,
    COALESCE(SUM(total), 0) as total_ingresos
  FROM ventas
  WHERE monto_pagado >= total
`).get();

console.log('1. HISTORIAL DE VENTAS (v.total de ventas pagadas):');
console.log(`   Ventas: ${historial.num_ventas}`);
console.log(`   Total: $${historial.total_ingresos.toLocaleString()}`);

// 2. Analytics (Solo ventas QUE TIENEN DETALLES)
const analyticsVentas = db.prepare(`
  SELECT DISTINCT v.id, v.total
  FROM ventas v
  INNER JOIN ventas_detalles vd ON v.id = vd.venta_id
  WHERE v.monto_pagado >= v.total
`).all();

const analyticsTotal = analyticsVentas.reduce((sum, v) => sum + v.total, 0);

console.log('\n2. ANALYTICS (v.total de ventas pagadas CON detalles):');
console.log(`   Ventas: ${analyticsVentas.length}`);
console.log(`   Total: $${analyticsTotal.toLocaleString()}`);

// 3. Diferencia: Ventas SIN detalles
const sinDetalles = db.prepare(`
  SELECT 
    v.id,
    v.fecha,
    v.total,
    v.monto_pagado
  FROM ventas v
  LEFT JOIN ventas_detalles vd ON v.id = vd.venta_id
  WHERE v.monto_pagado >= v.total
  AND vd.id IS NULL
`).all();

const totalSinDetalles = sinDetalles.reduce((sum, v) => sum + v.total, 0);

console.log('\n3. VENTAS SIN DETALLES (pagadas pero sin productos):');
console.log(`   Ventas: ${sinDetalles.length}`);
console.log(`   Total: $${totalSinDetalles.toLocaleString()}`);

if (sinDetalles.length > 0) {
  console.log('\n   Ejemplos:');
  sinDetalles.slice(0, 5).forEach(v => {
    console.log(`     - Venta #${v.id}: ${v.fecha}, $${v.total.toLocaleString()}`);
  });
}

console.log('\n📊 VERIFICACIÓN:');
console.log(`   Total Historial: $${historial.total_ingresos.toLocaleString()}`);
console.log(`   Total Analytics: $${analyticsTotal.toLocaleString()}`);
console.log(`   Diferencia: $${(historial.total_ingresos - analyticsTotal).toLocaleString()}`);
console.log(`   Ventas sin detalles: $${totalSinDetalles.toLocaleString()}`);

if (Math.abs((historial.total_ingresos - analyticsTotal) - totalSinDetalles) < 1) {
  console.log('\n✅ CORRECTO: La diferencia son ventas sin detalles');
} else {
  console.log('\n❌ ERROR: Hay otra discrepancia');
}
