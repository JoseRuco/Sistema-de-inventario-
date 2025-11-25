const db = require('./src/config/database');

console.log('\n=== TEST DASHBOARD ===\n');

try {
  const fechaHoy = new Date().toISOString().split('T')[0];
  const mesActual = fechaHoy.substring(0, 7);

  console.log('📅 Fecha hoy:', fechaHoy);
  console.log('📅 Mes actual:', mesActual);

  // Test 1: Productos
  const productos = db.prepare('SELECT COUNT(*) as count FROM productos WHERE activo = 1').get();
  console.log('✅ Productos activos:', productos.count);

  // Test 2: Clientes
  const clientes = db.prepare('SELECT COUNT(*) as count FROM clientes WHERE activo = 1').get();
  console.log('✅ Clientes activos:', clientes.count);

  // Test 3: Ventas hoy
  const ventasHoy = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(monto_pagado), 0) as total
    FROM ventas
    WHERE DATE(fecha) = ?
  `).get(fechaHoy);
  console.log('✅ Ventas hoy:', ventasHoy);

  // Test 4: Ventas mes
  const ventasMes = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(monto_pagado), 0) as total
    FROM ventas
    WHERE strftime('%Y-%m', fecha) = ?
  `).get(mesActual);
  console.log('✅ Ventas mes:', ventasMes);

  // Test 5: Bajo stock
  const lowStock = db.prepare(`
    SELECT id, nombre, tipo, presentacion, stock
    FROM productos
    WHERE stock < 10 AND activo = 1
    ORDER BY stock ASC
    LIMIT 5
  `).all();
  console.log('✅ Productos bajo stock:', lowStock.length);

  // Test 6: Ventas recientes
  const recentSales = db.prepare(`
    SELECT 
      v.id,
      v.fecha,
      v.total,
      v.metodo_pago,
      c.nombre as cliente_nombre
    FROM ventas v
    LEFT JOIN clientes c ON v.cliente_id = c.id
    ORDER BY v.fecha DESC
    LIMIT 5
  `).all();
  console.log('✅ Ventas recientes:', recentSales.length);
  recentSales.forEach(v => {
    console.log(`   - Venta #${v.id}: $${v.total} - ${v.cliente_nombre || 'Sin cliente'}`);
  });

  // Test 7: Charts
  const fechaInicio = new Date();
  fechaInicio.setDate(fechaInicio.getDate() - 6);
  const fechaInicioStr = fechaInicio.toISOString().split('T')[0];

  const salesData = db.prepare(`
    SELECT DATE(fecha) as fecha,
           COUNT(*) as cantidad,
           SUM(monto_pagado) as total
    FROM ventas
    WHERE DATE(fecha) BETWEEN ? AND ?
    GROUP BY DATE(fecha)
    ORDER BY DATE(fecha)
  `).all(fechaInicioStr, fechaHoy);
  console.log('✅ Datos para gráficas:', salesData.length, 'días');

  // Test 8: Top productos
  const topProducts = db.prepare(`
    SELECT 
      p.nombre,
      p.tipo,
      SUM(vd.cantidad) as cantidad_vendida
    FROM ventas_detalles vd
    INNER JOIN productos p ON vd.producto_id = p.id
    GROUP BY vd.producto_id
    ORDER BY cantidad_vendida DESC
    LIMIT 5
  `).all();
  console.log('✅ Top productos:', topProducts.length);

  console.log('\n✅ TODOS LOS DATOS SE GENERAN CORRECTAMENTE\n');

} catch (error) {
  console.error('❌ ERROR:', error);
}
