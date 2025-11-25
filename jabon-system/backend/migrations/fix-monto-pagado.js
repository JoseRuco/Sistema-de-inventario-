const db = require('./src/config/database');

console.log('🔧 Corrigiendo datos de ventas...\n');

try {
  // Actualizar todas las ventas que tienen monto_pagado NULL o 0
  // pero estado_pago = 'pagado'
  const result1 = db.prepare(`
    UPDATE ventas 
    SET 
      monto_pagado = total,
      monto_pendiente = 0
    WHERE estado_pago = 'pagado' 
    AND (monto_pagado IS NULL OR monto_pagado = 0)
  `).run();

  console.log(`✅ Actualizadas ${result1.changes} ventas pagadas`);

  // Para ventas pendientes, establecer monto_pagado = 0 y monto_pendiente = total
  const result2 = db.prepare(`
    UPDATE ventas 
    SET 
      monto_pagado = 0,
      monto_pendiente = total
    WHERE estado_pago = 'pendiente' 
    AND (monto_pagado IS NULL)
  `).run();

  console.log(`✅ Actualizadas ${result2.changes} ventas pendientes`);

  // Para ventas parciales, calcular monto_pendiente si está en 0
  const result3 = db.prepare(`
    UPDATE ventas 
    SET 
      monto_pendiente = total - monto_pagado
    WHERE estado_pago = 'parcial' 
    AND monto_pendiente = 0
    AND monto_pagado > 0
  `).run();

  console.log(`✅ Actualizadas ${result3.changes} ventas parciales`);

  // Verificar resultados
  const totalPagado = db.prepare('SELECT SUM(monto_pagado) as total FROM ventas').get();
  const totalVentas = db.prepare('SELECT SUM(total) as total FROM ventas').get();
  const totalPendiente = db.prepare('SELECT SUM(monto_pendiente) as total FROM ventas').get();
  
  console.log('\n📊 RESUMEN DESPUÉS DE LA CORRECCIÓN:');
  console.log('Total de ventas (total):        $' + totalVentas.total.toLocaleString());
  console.log('Total realmente pagado:         $' + totalPagado.total.toLocaleString());
  console.log('Total pendiente (deuda):        $' + totalPendiente.total.toLocaleString());
  console.log('\n✅ Corrección completada exitosamente');

} catch (error) {
  console.error('❌ Error:', error);
}
