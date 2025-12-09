const Database = require('better-sqlite3');
const db = new Database('../db/database_vieja.db');

console.log('\n=== VERIFICANDO FÓRMULA: Costos + Ganancia = Ingresos ===\n');

// Solo ventas con detalles
const ventasConDetalles = db.prepare(`
  SELECT DISTINCT v.id, v.total
  FROM ventas v
  INNER JOIN ventas_detalles vd ON v.id = vd.venta_id
  WHERE v.monto_pagado >= v.total
`).all();

console.log('Ventas con detalles:', ventasConDetalles.length);

const ids = ventasConDetalles.map(v => v.id);
const placeholders = ids.map(() => '?').join(',');

// INGRESOS desde ventas.total
const ingresos = db.prepare(`
  SELECT SUM(v.total) as total
  FROM ventas v
  WHERE v.id IN (${placeholders})
`).get(...ids);

// COSTOS y GANANCIA desde ventas_detalles
const costosYGanancia = db.prepare(`
  SELECT 
    SUM(vd.subtotal) as ingresos_detalles,
    SUM(vd.cantidad * p.precio_costo) as costos,
    SUM(vd.subtotal - (vd.cantidad * p.precio_costo)) as ganancia
  FROM ventas_detalles vd
  INNER JOIN productos p ON vd.producto_id = p.id
  WHERE vd.venta_id IN (${placeholders})
`).get(...ids);

console.log('1. INGRESOS (v.total):', ingresos.total);
console.log('2. INGRESOS (vd.subtotal):', costosYGanancia.ingresos_detalles);
console.log('3. COSTOS:', costosYGanancia.costos);
console.log('4. GANANCIA:', costosYGanancia.ganancia);
console.log('\n--- VERIFICACIÓN ---');
console.log('Costos + Ganancia:', costosYGanancia.costos + costosYGanancia.ganancia);
console.log('Ingresos (v.total):', ingresos.total);
console.log('Diferencia:', ingresos.total - (costosYGanancia.costos + costosYGanancia.ganancia));

if (Math.abs(ingresos.total - (costosYGanancia.costos + costosYGanancia.ganancia)) < 1) {
  console.log('\n✅ CORRECTO: Costos + Ganancia = Ingresos');
} else {
  console.log('\n❌ ERROR: No cuadra la ecuación');
  console.log('Causa: v.total y sum(vd.subtotal) no coinciden');
}

db.close();
