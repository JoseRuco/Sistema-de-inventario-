// backend/src/utils/stockLogger.js
const db = require('../config/database');

// Registra un movimiento de stock y fija el stock del producto al nuevo valor calculado.
// tipo se deduce por delta (>0 ingreso, <0 salida, 0 ajuste).
// ref: { tipo: 'VENTA'|'AJUSTE'|'COMPRA', id: number } opcional.
async function logStockMovement(producto_id, delta, motivo = null, ref = null) {
  const prod = await db.prepare(`SELECT stock FROM productos WHERE id = ?`).get(producto_id);
  if (!prod) throw new Error('Producto no encontrado');

  const stock_anterior = Number(prod.stock || 0);
  const stock_nuevo = stock_anterior + Number(delta);
  const tipo = delta > 0 ? 'INGRESO' : (delta < 0 ? 'SALIDA' : 'AJUSTE');

  await db.prepare(`
    INSERT INTO stock_movimientos
      (producto_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo, referencia_tipo, referencia_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    producto_id,
    tipo,
    Math.abs(Number(delta)),
    stock_anterior,
    stock_nuevo,
    motivo,
    ref?.tipo || null,
    ref?.id ?? null
  );

  await db.prepare(`UPDATE productos SET stock = ? WHERE id = ?`).run(stock_nuevo, producto_id);

  return { producto_id, tipo, cantidad: Math.abs(Number(delta)), stock_anterior, stock_nuevo };
}

module.exports = { logStockMovement };
