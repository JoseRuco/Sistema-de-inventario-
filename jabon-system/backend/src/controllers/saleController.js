const db = require('../config/database');
const notificationService = require('../services/notificationService');
const { getColombiaDateTime } = require('../utils/dateHelper');

// Crear una nueva venta
exports.createSale = (req, res) => {
  try {
    const {
      cliente_id,
      fecha,
      productos,
      metodo_pago,
      estado_pago,
      monto_pagado,
      monto_pendiente,
      descuento,
      notas
    } = req.body;

    // Validaciones
    if (!cliente_id) {
      return res.status(400).json({
        success: false,
        error: 'El cliente es requerido'
      });
    }

    // ✅ VALIDACIÓN: No permitir ventas fiadas al Cliente General
    if (parseInt(cliente_id) === 1 && estado_pago !== 'pagado') {
      return res.status(400).json({
        success: false,
        error: 'No se pueden registrar ventas fiadas para el Cliente General',
        message: 'El Cliente General solo puede realizar compras pagadas completamente. Si el cliente desea crédito, debe registrarse primero.'
      });
    }

    if (!productos || productos.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Debe agregar al menos un producto'
      });
    }

    // Calcular el total de productos
    const totalProductos = productos.reduce((sum, p) => sum + p.subtotal, 0);
    
    // Aplicar descuento si existe
    const descuentoAplicado = descuento && descuento > 0 ? parseFloat(descuento) : 0;
    const total = totalProductos - descuentoAplicado;

    // Validar que el descuento no sea mayor al total
    if (descuentoAplicado > totalProductos) {
      return res.status(400).json({
        success: false,
        error: 'El descuento no puede ser mayor al total de la compra'
      });
    }

    // Validar stock disponible
    for (const producto of productos) {
      const stockActual = db.prepare(
        'SELECT stock FROM productos WHERE id = ?'
      ).get(producto.producto_id);

      if (!stockActual) {
        return res.status(404).json({
          success: false,
          error: `Producto con ID ${producto.producto_id} no encontrado`
        });
      }

      if (stockActual.stock < producto.cantidad) {
        return res.status(400).json({
          success: false,
          error: `Stock insuficiente para el producto ${producto.nombre}`
        });
      }
    }

    // Iniciar transacción
    const insertSale = db.prepare(`
      INSERT INTO ventas (
        cliente_id, 
        fecha, 
        total, 
        metodo_pago,
        estado_pago,
        monto_pagado,
        monto_pendiente,
        descuento,
        notas
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertSale.run(
      cliente_id,
      getColombiaDateTime(), // Usar hora de Colombia
      total,
      metodo_pago || 'efectivo',
      estado_pago || 'pagado',
      monto_pagado !== undefined ? monto_pagado : total,
      monto_pendiente !== undefined ? monto_pendiente : 0,
      descuentoAplicado,
      notas || ''
    );

    const venta_id = result.lastInsertRowid;

    // Insertar detalles de la venta
    const insertDetail = db.prepare(`
      INSERT INTO ventas_detalles (
        venta_id, 
        producto_id, 
        cantidad, 
        precio_unitario, 
        subtotal
      )
      VALUES (?, ?, ?, ?, ?)
    `);

    const updateStock = db.prepare(`
      UPDATE productos 
      SET stock = stock - ? 
      WHERE id = ?
    `);

    for (const producto of productos) {
      // Insertar detalle
      insertDetail.run(
        venta_id,
        producto.producto_id,
        producto.cantidad,
        producto.precio_unitario,
        producto.subtotal
      );

      // Actualizar stock
      updateStock.run(producto.cantidad, producto.producto_id);

      // 🔔 VERIFICAR STOCK BAJO Y ENVIAR ALERTA
      try {
        const currentStock = db.prepare('SELECT stock, nombre, presentacion FROM productos WHERE id = ?').get(producto.producto_id);
        if (currentStock && currentStock.stock < 10) {
          console.log(`⚠️ Stock bajo detectado para ${currentStock.nombre} (${currentStock.presentacion}): ${currentStock.stock}`);
          notificationService.sendLowStockAlert(currentStock.nombre, currentStock.presentacion, currentStock.stock);
        }
      } catch (alertError) {
        console.error('Error verificando alerta de stock:', alertError);
      }
    }

    // Si hay un abono inicial en venta fiada, registrarlo
    if (estado_pago === 'parcial' && monto_pagado > 0) {
      try {
        const insertAbono = db.prepare(`
          INSERT INTO abonos (venta_id, cliente_id, monto, metodo_pago, notas, fecha)
          VALUES (?, ?, ?, ?, ?, ?)
        `);

        insertAbono.run(
          venta_id,
          cliente_id,
          monto_pagado,
          metodo_pago || 'efectivo',
          'Abono inicial al momento de la venta',
          getColombiaDateTime()
        );
      } catch (abonoError) {
        console.warn('⚠️ No se pudo registrar el abono inicial:', abonoError.message);
      }
    }

    res.json({
      success: true,
      message: 'Venta registrada exitosamente',
      venta_id: venta_id,
      total: total
    });

  } catch (error) {
    console.error('Error creando venta:', error);
    res.status(500).json({
      success: false,
      error: 'Error al registrar la venta'
    });
  }
};

// Obtener todas las ventas con paginación y filtros
exports.getSales = (req, res) => {
  try {
    let { 
      page = 1, 
      limit = 50, 
      search = '', 
      clientId = '', 
      client_id = '',
      paymentMethod = '', 
      paymentStatus = '',
      startDate = '',
      endDate = '',
      includeSummary = 'true' 
    } = req.query;

    const finalClientId = clientId || client_id;

    const shouldIncludeSummary = includeSummary === 'true';

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 50;
    const offset = (page - 1) * limit;
    
    const params = [];
    let whereClause = 'WHERE 1=1';

    // Construir WHERE dinámico
    if (search) {
      // Búsqueda por ID, Cliente O PRODUCTO
      whereClause += ` AND (
        v.id = ? 
        OR v.id LIKE ? 
        OR LOWER(c.nombre) LIKE LOWER(?) 
        OR EXISTS (
          SELECT 1 FROM ventas_detalles vd 
          JOIN productos p ON vd.producto_id = p.id 
          WHERE vd.venta_id = v.id AND LOWER(p.nombre) LIKE LOWER(?)
        )
      )`;
      const searchPattern = `%${search}%`;
      params.push(search, searchPattern, searchPattern, searchPattern);
    }

    if (finalClientId) {
      whereClause += ` AND v.cliente_id = ?`;
      params.push(finalClientId);
    }

    if (paymentMethod) {
      whereClause += ` AND v.metodo_pago = ?`;
      params.push(paymentMethod);
    }

    if (paymentStatus) {
      whereClause += ` AND v.estado_pago = ?`;
      params.push(paymentStatus);
    }

    // Filtro de fecha
    if (startDate) {
      whereClause += ` AND date(v.fecha) >= ?`;
      params.push(startDate);
    }
    
    if (endDate) {
      whereClause += ` AND date(v.fecha) <= ?`;
      params.push(endDate);
    }

    // 1. Query para contar totales (Resumen)
    // 1. Query para contar totales (Resumen) - SOLO SI SE REQUIERE
    let summary = { totalRecords: 0, totalIncome: 0, countPending: 0, countPartial: 0 };
    
    if (shouldIncludeSummary) {
      const summaryQuery = `
        SELECT 
          COUNT(*) as totalRecords,
          COALESCE(SUM(v.monto_pagado), 0) as totalIncome,
          COALESCE(SUM(CASE WHEN v.estado_pago = 'pendiente' THEN 1 ELSE 0 END), 0) as countPending,
          COALESCE(SUM(CASE WHEN v.estado_pago = 'parcial' THEN 1 ELSE 0 END), 0) as countPartial
        FROM ventas v
        LEFT JOIN clientes c ON v.cliente_id = c.id
        ${whereClause}
      `;
      summary = db.prepare(summaryQuery).get(...params);
    } else {
        // Si no pedimos resumen, al menos necesitamos totalRecords para saber si hay más páginas
        // O podemos devolver -1 si el frontend maneja la paginación infinita solo con "data.length < limit"
        // Pero para mantener la paginación numerada, necesitamos el count.
        // Optimización media: Solo contar records, no sumar dinero.
        const countQuery = `
            SELECT COUNT(*) as totalRecords 
            FROM ventas v 
            LEFT JOIN clientes c ON v.cliente_id = c.id
            ${whereClause}
        `;
        const countResult = db.prepare(countQuery).get(...params);
        summary.totalRecords = countResult.totalRecords;
    }

    // 2. Query para obtener datos paginados
    const dataQuery = `
      SELECT 
        v.id,
        v.fecha,
        v.total,
        v.metodo_pago,
        v.estado_pago,
        v.monto_pagado,
        v.monto_pendiente,
        v.descuento,
        v.notas,
        c.id as cliente_id,
        c.nombre as cliente_nombre,
        c.telefono,
        c.direccion
      FROM ventas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      ${whereClause}
      ORDER BY v.fecha DESC
      LIMIT ? OFFSET ?
    `;

    // Añadir limit y offset a los parámetros para la query de datos
    const dataParams = [...params, limit, offset];
    const ventas = db.prepare(dataQuery).all(...dataParams);

    res.json({ 
      success: true, 
      data: ventas,
      pagination: {
        page: page,
        limit: limit,
        totalRecords: summary.totalRecords || 0,
        totalPages: Math.ceil((summary.totalRecords || 0) / limit)
      },
      summary: {
        totalIncome: summary.totalIncome,
        countPending: summary.countPending,
        countPartial: summary.countPartial,
        totalRecords: summary.totalRecords
      }
    });

  } catch (error) {
    console.error('Error obteniendo ventas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener las ventas'
    });
  }
};

// Obtener una venta específica con sus detalles
exports.getSale = (req, res) => {
  try {
    const { id } = req.params;

    // Obtener información de la venta
    const venta = db.prepare(`
      SELECT 
        v.id,
        v.fecha,
        v.total,
        v.metodo_pago,
        v.estado_pago,
        v.monto_pagado,
        v.monto_pendiente,
        v.descuento,
        v.notas,
        c.id as cliente_id,
        c.nombre as cliente_nombre,
        c.telefono,
        c.direccion
      FROM ventas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      WHERE v.id = ?
    `).get(id);

    if (!venta) {
      return res.status(404).json({
        success: false,
        error: 'Venta no encontrada'
      });
    }

    // Obtener detalles de la venta
    const detalles = db.prepare(`
      SELECT 
        vd.id,
        vd.cantidad,
        vd.precio_unitario,
        vd.subtotal,
        p.nombre as producto_nombre,
        p.tipo,
        p.presentacion
      FROM ventas_detalles vd
      INNER JOIN productos p ON vd.producto_id = p.id
      WHERE vd.venta_id = ?
    `).all(id);

    venta.detalles = detalles;

    res.json({ success: true, data: venta });
  } catch (error) {
    console.error('Error obteniendo venta:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener la venta'
    });
  }
};

// Eliminar una venta (solo para testing - no recomendado en producción)
exports.deleteSale = (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que la venta existe
    const venta = db.prepare('SELECT * FROM ventas WHERE id = ?').get(id);

    if (!venta) {
      return res.status(404).json({
        success: false,
        error: 'Venta no encontrada'
      });
    }

    // Obtener productos de la venta para restaurar stock
    const detalles = db.prepare(`
      SELECT producto_id, cantidad 
      FROM ventas_detalles 
      WHERE venta_id = ?
    `).all(id);

    // Restaurar stock
    const updateStock = db.prepare(`
      UPDATE productos 
      SET stock = stock + ? 
      WHERE id = ?
    `);

    for (const detalle of detalles) {
      updateStock.run(detalle.cantidad, detalle.producto_id);
    }

    // Eliminar detalles de la venta
    db.prepare('DELETE FROM ventas_detalles WHERE venta_id = ?').run(id);

    // Eliminar abonos asociados
    db.prepare('DELETE FROM abonos WHERE venta_id = ?').run(id);

    // Eliminar la venta
    db.prepare('DELETE FROM ventas WHERE id = ?').run(id);

    res.json({
      success: true,
      message: 'Venta eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando venta:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar la venta'
    });
  }
};
