const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../database_vieja.db');
const db = new Database(dbPath);

console.log('📊 VERIFICACIÓN DE DATOS\n');

// Total de ventas
const totalVentas = db.prepare('SELECT COUNT(*) as count FROM ventas').get();
console.log(`📌 Total de ventas: ${totalVentas.count}`);

// Total de ventas_detalles
const totalDetalles = db.prepare('SELECT COUNT(*) as count FROM ventas_detalles').get();
console.log(`📌 Total de detalles en ventas_detalles: ${totalDetalles.count}`);

// Total en detalle_ventas (vieja)
try {
  const totalDetallesViejos = db.prepare('SELECT COUNT(*) as count FROM detalle_ventas').get();
  console.log(`📌 Total de detalles en detalle_ventas (vieja): ${totalDetallesViejos.count}`);
} catch (e) {
  console.log(`📌 Tabla detalle_ventas no existe (ya fue eliminada)`);
}

// Total de ingresos
const totalIngresos = db.prepare('SELECT SUM(total) as total FROM ventas').get();
console.log(`💰 Total de ingresos: $${(totalIngresos.total || 0).toLocaleString()}`);

// Ventas hoy
const hoy = new Date();
const year = hoy.getFullYear();
const month = String(hoy.getMonth() + 1).padStart(2, '0');
const day = String(hoy.getDate()).padStart(2, '0');
const fechaHoy = `${year}-${month}-${day}`;

const ventasHoy = db.prepare(`
  SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total 
  FROM ventas 
  WHERE DATE(fecha) = ?
`).get(fechaHoy);

console.log(`📅 Ventas hoy (${fechaHoy}): ${ventasHoy.count} ventas por $${ventasHoy.total.toLocaleString()}`);

// Ventas del mes
const mesActual = `${year}-${month}`;
const ventasMes = db.prepare(`
  SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total 
  FROM ventas 
  WHERE strftime('%Y-%m', fecha) = ?
`).get(mesActual);

console.log(`📅 Ventas del mes (${mesActual}): ${ventasMes.count} ventas por $${ventasMes.total.toLocaleString()}`);

// Top 5 productos más vendidos del mes
console.log(`\n🏆 TOP 5 PRODUCTOS DEL MES:`);
const topProductos = db.prepare(`
  SELECT 
    p.nombre,
    p.tipo,
    p.presentacion,
    SUM(vd.cantidad) as total_vendido,
    SUM(vd.subtotal) as total_ingresos
  FROM ventas_detalles vd
  JOIN productos p ON vd.producto_id = p.id
  JOIN ventas v ON vd.venta_id = v.id
  WHERE strftime('%Y-%m', v.fecha) = ?
  GROUP BY vd.producto_id
  ORDER BY total_vendido DESC
  LIMIT 5
`).all(mesActual);

topProductos.forEach((p, i) => {
  console.log(`   ${i + 1}. ${p.nombre} (${p.tipo} - ${p.presentacion})`);
  console.log(`      Vendido: ${p.total_vendido} unidades - Ingresos: $${p.total_ingresos.toLocaleString()}`);
});

db.close();
console.log('\n✅ Verificación completada');
