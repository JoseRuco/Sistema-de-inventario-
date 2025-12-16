const db = require('../config/database');
const { getColombiaDateTime } = require('../utils/dateHelper');

// Obtener todas las ventas con deuda pendiente
exports.getPendingDebts = (req, res) => {
  try {
    const debts = db.prepare(`
      SELECT 
        v.id,
        v.fecha,
        v.total,
        v.estado_pago,
        v.monto_pagado,
        v.monto_pendiente,
        c.id as cliente_id,
        c.nombre as cliente_nombre,
        c.telefono as cliente_telefono
      FROM ventas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      WHERE v.estado_pago IN ('pendiente', 'parcial')
      ORDER BY v.fecha DESC
    `).all();

    res.json({ success: true, data: debts });
  } catch (error) {
    console.error('Error obteniendo deudas:', error);
    res.status(500).json({ success: false, error: 'Error al obtener deudas pendientes' });
  }
};

// Obtener deuda de un cliente específico
exports.getClientDebt = (req, res) => {
  try {
    const { clientId } = req.params;

    const debts = db.prepare(`
      SELECT 
        v.id,
        v.fecha,
        v.total,
        v.estado_pago,
        v.monto_pagado,
        v.monto_pendiente
      FROM ventas v
      WHERE v.cliente_id = ? AND v.estado_pago IN ('pendiente', 'parcial')
      ORDER BY v.fecha DESC
    `).all(clientId);

    const totalDebt = debts.reduce((sum, debt) => sum + debt.monto_pendiente, 0);

    res.json({
      success: true,
      data: { debts, totalDebt }
    });
  } catch (error) {
    console.error('Error obteniendo deuda del cliente:', error);
    res.status(500).json({ success: false, error: 'Error al obtener deuda del cliente' });
  }
};

// Registrar un abono
exports.registerPayment = (req, res) => {
  try {
    const { venta_id, cliente_id, monto, metodo_pago, notas } = req.body;

    // Validar datos
    if (!venta_id || !cliente_id || !monto || monto <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Datos de abono inválidos'
      });
    }

    // Obtener información de la venta
    const venta = db.prepare('SELECT * FROM ventas WHERE id = ?').get(venta_id);

    if (!venta) {
      return res.status(404).json({ success: false, error: 'Venta no encontrada' });
    }

    // Validar que el abono no exceda la deuda
    if (monto > venta.monto_pendiente) {
      return res.status(400).json({
        success: false,
        error: 'El abono excede el monto pendiente'
      });
    }

    // Registrar el abono con fecha local de Colombia
    const insertAbono = db.prepare(`
      INSERT INTO abonos (venta_id, cliente_id, monto, metodo_pago, notas, fecha)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = insertAbono.run(
      venta_id,
      cliente_id,
      monto,
      metodo_pago || 'efectivo',
      notas || '',
      getColombiaDateTime()
    );

    // Actualizar el estado de la venta
    const nuevoMontoPagado = venta.monto_pagado + monto;
    const nuevoMontoPendiente = venta.total - nuevoMontoPagado;
    const nuevoEstado = nuevoMontoPendiente === 0 ? 'pagado' : 'parcial';

    db.prepare(`
      UPDATE ventas 
      SET monto_pagado = ?, monto_pendiente = ?, estado_pago = ?
      WHERE id = ?
    `).run(nuevoMontoPagado, nuevoMontoPendiente, nuevoEstado, venta_id);

    res.json({
      success: true,
      message: 'Abono registrado exitosamente',
      data: {
        abono_id: result.lastInsertRowid,
        nuevo_saldo: nuevoMontoPendiente
      }
    });

  } catch (error) {
    console.error('Error registrando abono:', error);
    res.status(500).json({ success: false, error: 'Error al registrar el abono' });
  }
};

// Obtener historial de abonos de una venta
exports.getPaymentHistory = (req, res) => {
  try {
    const { ventaId } = req.params;

    const abonos = db.prepare(`
      SELECT * FROM abonos 
      WHERE venta_id = ? 
      ORDER BY fecha DESC
    `).all(ventaId);

    res.json({ success: true, data: abonos });
  } catch (error) {
    console.error('Error obteniendo historial de abonos:', error);
    res.status(500).json({ success: false, error: 'Error al obtener historial de abonos' });
  }
};

// Obtener resumen de cartera
exports.getPortfolioSummary = (req, res) => {
  try {
    const summary = db.prepare(`
      SELECT 
        COUNT(*) as total_ventas_pendientes,
        SUM(monto_pendiente) as total_pendiente,
        COUNT(DISTINCT cliente_id) as clientes_con_deuda,
        SUM(CASE WHEN estado_pago = 'pendiente' THEN 1 ELSE 0 END) as count_pendiente,
        SUM(CASE WHEN estado_pago = 'parcial' THEN 1 ELSE 0 END) as count_parcial
      FROM ventas
      WHERE estado_pago IN ('pendiente', 'parcial')
    `).get();

    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Error obteniendo resumen de cartera:', error);
    res.status(500).json({ success: false, error: 'Error al obtener resumen' });
  }
};
