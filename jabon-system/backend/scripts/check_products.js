const db = require('../src/config/database');

// Ver QUÉ productos NO están apareciendo
const ventasQuery = `
  SELECT DISTINCT v.id
  FROM ventas v
  INNER JOIN ventas_detalles vd ON v.id = vd.venta_id
  WHERE v.monto_pagado >= v.total
`;

const ventas = db.prepare(ventasQuery).all();
const ids = ventas.map(v => v.id);
const placeholders = ids.map(() => '?').join(',');

// Productos VENDIDOS en esas ventas
const productosVendidos = db.prepare(`
  SELECT DISTINCT p.id, p.nombre, p.tipo, p.activo
  FROM productos p
  INNER JOIN ventas_detalles vd ON p.id = vd.producto_id
  WHERE vd.venta_id IN (${placeholders})
`).all(...ids);

console.log('\n📦 PRODUCTOS VENDIDOS:\n');
const grouped = {};
productosVendidos.forEach(p => {
  if (!grouped[p.tipo]) grouped[p.tipo] = [];
  grouped[p.tipo].push(`${p.nombre} (activo=${p.activo})`);
});

Object.keys(grouped).forEach(tipo => {
  console.log(`${tipo}:`);
  grouped[tipo].forEach(p => console.log(`  - ${p}`));
});

// Verificar productos inactivos
const inactivos = productosVendidos.filter(p => p.activo === 0);
if (inactivos.length > 0) {
  console.log(`\n⚠️ PRODUCTOS INACTIVOS VENDIDOS: ${inactivos.length}`);
  inactivos.forEach(p => console.log(`  - ${p.nombre} (${p.tipo})`));
}
