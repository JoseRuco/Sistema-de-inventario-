// Test directo del endpoint analytics
const db = require('../src/config/database');

console.log('\n🔍 EJECUTANDO EXACTAMENTE LA MISMA LÓGICA DEL CONTROLLER:\n');

// PASO 1
let ventasQuery = `
  SELECT DISTINCT v.id, v.total, v.monto_pagado
  FROM ventas v
  INNER JOIN ventas_detalles vd ON v.id = vd.venta_id
  WHERE v.monto_pagado >= v.total
`;

const ventasPagadas = db.prepare(ventasQuery).all();
console.log(`PASO 1: Ventas con detalles = ${ventasPagadas.length}`);

const ventasIds = ventasPagadas.map(v => v.id);
const placeholders = ventasIds.map(() => '?').join(',');

// PASO 2
const totalsQuery = `
  SELECT 
    COALESCE(SUM(v.total), 0) as ingresos_totales
  FROM ventas v
  WHERE v.id IN (${placeholders})
`;

const generalTotals = db.prepare(totalsQuery).get(...ventasIds);
console.log(`PASO 2: Ingresos totales = ${generalTotals.ingresos_totales}`);

// PASO 3
const categoryQuery = `
  SELECT 
    p.tipo as categoria,
    COUNT(DISTINCT p.id) as num_productos,
    COALESCE(SUM(vd.cantidad), 0) as unidades_vendidas,
    COALESCE(SUM(vd.subtotal), 0) as ingresos_categoria,
    COALESCE(SUM(vd.cantidad * p.precio_costo), 0) as costos_categoria,
    COALESCE(SUM(vd.subtotal - (vd.cantidad * p.precio_costo)), 0) as ganancia_categoria
  FROM productos p
  INNER JOIN ventas_detalles vd ON p.id = vd.producto_id
  WHERE vd.venta_id IN (${placeholders})
  GROUP BY p.tipo
  ORDER BY ganancia_categoria DESC
`;

const margins = db.prepare(categoryQuery).all(...ventasIds);

console.log('\nPASO 3: Categorías:');
margins.forEach(cat => {
  console.log(`  ${cat.categoria}: costos=${cat.costos_categoria}, ganancia=${cat.ganancia_categoria}`);
});

// PASO 4
const costosTotales = margins.reduce((sum, cat) => sum + cat.costos_categoria, 0);
const gananciaNeta = margins.reduce((sum, cat) => sum + cat.ganancia_categoria, 0);

console.log(`\nPASO 4: Totales calculados`);
console.log(`  Costos = ${costosTotales}`);
console.log(`  Ganancia = ${gananciaNeta}`);

console.log(`\n✅ VERIFICACIÓN FINAL:`);
console.log(`  Ingresos: ${generalTotals.ingresos_totales}`);
console.log(`  Costos: ${costosTotales}`);
console.log(`  Ganancia: ${gananciaNeta}`);
console.log(`  Costos + Ganancia = ${costosTotales + gananciaNeta}`);

if (costosTotales + gananciaNeta === generalTotals.ingresos_totales) {
  console.log(`\n✅ CORRECTO: La ecuación cuadra`);
} else {
  const diff = generalTotals.ingresos_totales - (costosTotales + gananciaNeta);
  console.log(`\n❌ ERROR: Diferencia de ${diff}`);
}
