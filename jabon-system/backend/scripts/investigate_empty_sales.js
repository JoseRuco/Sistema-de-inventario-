const db = require('../src/config/database');

console.log('\n🔍 INVESTIGACIÓN DE VENTAS SIN DETALLES:\n');

// Obtener las 8 ventas sin detalles
const ventasSinDetalles = db.prepare(`
  SELECT 
    v.id,
    v.fecha,
    v.total,
    v.monto_pagado,
    v.estado_pago,
    v.metodo_pago,
    v.cliente_id,
    c.nombre as cliente_nombre
  FROM ventas v
  LEFT JOIN ventas_detalles vd ON v.id = vd.venta_id
  LEFT JOIN clientes c ON v.cliente_id = c.id
  WHERE v.monto_pagado >= v.total
  AND vd.id IS NULL
  ORDER BY v.fecha
`).all();

console.log(`Total de ventas sin detalles: ${ventasSinDetalles.length}\n`);

ventasSinDetalles.forEach((v, i) => {
  console.log(`${i + 1}. Venta #${v.id}`);
  console.log(`   Fecha: ${v.fecha}`);
  console.log(`   Cliente: ${v.cliente_nombre || 'Sin cliente'}`);
  console.log(`   Total: $${v.total.toLocaleString()}`);
  console.log(`   Estado: ${v.estado_pago}`);
  console.log(`   Método: ${v.metodo_pago}`);
  console.log('');
});

// Analizar patrones
const fechas = ventasSinDetalles.map(v => new Date(v.fecha));
const primeraVenta = new Date(Math.min(...fechas));
const ultimaVenta = new Date(Math.max(...fechas));

console.log('📊 ANÁLISIS DE PATRONES:\n');
console.log(`Primera venta sin detalles: ${primeraVenta.toLocaleString('es-CO')}`);
console.log(`Última venta sin detalles: ${ultimaVenta.toLocaleString('es-CO')}`);

// ¿Son todas del mismo día o período?
const diasUnicos = [...new Set(ventasSinDetalles.map(v => v.fecha.split(' ')[0]))];
console.log(`\nDías únicos con ventas sin detalles: ${diasUnicos.length}`);
diasUnicos.forEach(dia => {
  const ventasEseDia = ventasSinDetalles.filter(v => v.fecha.startsWith(dia)).length;
  console.log(`  - ${dia}: ${ventasEseDia} ventas`);
});

// ¿Tienen un patrón en los montos?
const montosUnicos = [...new Set(ventasSinDetalles.map(v => v.total))];
console.log(`\nMontos únicos: ${montosUnicos.map(m => '$' + m.toLocaleString()).join(', ')}`);

// Verificar si hay detalles en otra tabla (legacy)
const detallesLegacy = db.prepare(`
  SELECT COUNT(*) as count
  FROM detalle_ventas dv
  WHERE dv.venta_id IN (${ventasSinDetalles.map(v => v.id).join(',')})
`).get();

console.log(`\n🔍 ¿Tienen detalles en tabla legacy (detalle_ventas)?`);
console.log(`   Registros encontrados: ${detallesLegacy.count}`);

if (detallesLegacy.count > 0) {
  console.log('\n⚠️ PROBLEMA IDENTIFICADO: Los detalles están en tabla legacy');
  console.log('   Solución: Migrar datos de detalle_ventas a ventas_detalles');
} else {
  console.log('\n⚠️ PROBLEMA IDENTIFICADO: Las ventas realmente no tienen productos');
  console.log('   Posibles causas:');
  console.log('   1. Ventas de prueba durante desarrollo');
  console.log('   2. Bug en versión anterior del sistema');
  console.log('   3. Datos migrados incorrectamente');
}

// Ver la primera venta CON detalles para comparar
const primeraConDetalles = db.prepare(`
  SELECT v.id, v.fecha, v.total
  FROM ventas v
  INNER JOIN ventas_detalles vd ON v.id = vd.venta_id
  WHERE v.monto_pagado >= v.total
  ORDER BY v.fecha
  LIMIT 1
`).get();

if (primeraConDetalles) {
  console.log(`\n📅 COMPARACIÓN TEMPORAL:`);
  console.log(`   Primera venta SIN detalles: ${primeraVenta.toLocaleString('es-CO')}`);
  console.log(`   Primera venta CON detalles: ${new Date(primeraConDetalles.fecha).toLocaleString('es-CO')}`);
  
  if (new Date(primeraConDetalles.fecha) > primeraVenta) {
    console.log(`\n✅ CONCLUSIÓN: Las ventas sin detalles son ANTERIORES al sistema actual`);
    console.log(`   Son datos legacy o de prueba.`);
  } else {
    console.log(`\n⚠️ Las ventas sin detalles están mezcladas con las normales`);
  }
}
