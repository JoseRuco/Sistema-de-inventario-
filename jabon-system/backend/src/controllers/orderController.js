const db = require('../config/database');
const { getColombiaDateTime } = require('../utils/dateHelper');

// Crear un nuevo pedido
exports.createOrder = (req, res) => {
  try {
    const { cliente_id, fecha_entrega, productos } = req.body;

    if (!cliente_id || !productos || productos.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Datos incompletos: cliente y productos son requeridos'
      });
    }

    // Iniciar transacción explícita si fuera necesario, pero better-sqlite3 es síncrono.
    // Insertar pedido
    const insertOrder = db.prepare(`
      INSERT INTO pedidos (cliente_id, fecha_entrega, estado, created_at)
      VALUES (?, ?, 'pendiente', ?)
    `);

    const result = insertOrder.run(
      cliente_id,
      fecha_entrega,
      getColombiaDateTime()
    );

    const pedidoId = result.lastInsertRowid;

    // Insertar detalles
    const insertDetail = db.prepare(`
      INSERT INTO pedidos_detalles (pedido_id, producto_id, cantidad)
      VALUES (?, ?, ?)
    `);

    for (const prod of productos) {
      insertDetail.run(pedidoId, prod.producto_id, prod.cantidad);
    }

    res.json({
      success: true,
      message: 'Pedido registrado exitosamente',
      id: pedidoId
    });

  } catch (error) {
    console.error('Error creando pedido:', error);
    res.status(500).json({ success: false, error: 'Error al registrar el pedido' });
  }
};

// Obtener pedidos pendientes o en camino
exports.getOrders = (req, res) => {
  try {
    // Obtener pedidos que NO estén 'entregado' ni 'cancelado' (o según lógica de "desaparecer")
    // El usuario dijo "precionar EN CAMINO y desaparesaca", so maybe 'en_camino' also hides it from main list? 
    // O tal vez "en camino" es un estado intermedio y "entregado" es el final.
    // Voy a asumir que quiere ver los pendientes.
    // Si quiere que al poner "En Camino" desaparezca, entonces la lista principal filtra != 'en_camino'.
    // Pero mejor mostramos los activos.
    
    // Voy a traer todos los que NO sean 'entregado' ni 'cancelado' inicialmente para tener control,
    // o podemos aceptar un query param ?status=...
    
    const statusFilter = req.query.status || 'pendiente'; 

    const orders = db.prepare(`
      SELECT 
        p.id, 
        p.fecha_entrega, 
        p.estado, 
        p.created_at,
        c.nombre as cliente_nombre,
        c.telefono as cliente_telefono,
        c.direccion as cliente_direccion
      FROM pedidos p
      JOIN clientes c ON p.cliente_id = c.id
      WHERE p.estado = ?
      ORDER BY p.fecha_entrega ASC
    `).all(statusFilter);

    // Obtener detalles para cada pedido (esto podría optimizarse pero para pocos pedidos está bien)
    const getDetails = db.prepare(`
      SELECT 
        pd.cantidad, 
        pr.nombre, 
        pr.presentacion,
        pr.stock as stock_actual
      FROM pedidos_detalles pd
      JOIN productos pr ON pd.producto_id = pr.id
      WHERE pd.pedido_id = ?
    `);

    const ordersWithDetails = orders.map(order => {
      const details = getDetails.all(order.id);
      return { ...order, productos: details };
    });

    res.json({ success: true, data: ordersWithDetails });

  } catch (error) {
    console.error('Error obteniendo pedidos:', error);
    res.status(500).json({ success: false, error: 'Error obteniendo pedidos' });
  }
};

// Actualizar estado del pedido
exports.updateOrderStatus = (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body; // 'en_camino', 'entregado', 'cancelado'

    if (!['pendiente', 'en_camino', 'entregado', 'cancelado'].includes(estado)) {
      return res.status(400).json({ success: false, error: 'Estado inválido' });
    }

    const update = db.prepare('UPDATE pedidos SET estado = ? WHERE id = ?');
    const result = update.run(estado, id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
    }

    res.json({ success: true, message: `Pedido actualizado a ${estado}` });

  } catch (error) {
    console.error('Error actualizando pedido:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar el pedido' });
  }
};

// Eliminar pedido
exports.deleteOrder = (req, res) => {
  try {
    const { id } = req.params;
    // Borrar detalles primero (cascade debería encargarse, pero por seguridad)
    // Con ON DELETE CASCADE en sqlite, borrar el padre borra los hijos.
    
    const result = db.prepare('DELETE FROM pedidos WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
    }

    res.json({ success: true, message: 'Pedido eliminado' });

  } catch (error) {
    console.error('Error eliminando pedido:', error);
    res.status(500).json({ success: false, error: 'Error eliminando pedido' });
  }
};

// Dashboard Stats: Pedidos pendientes
exports.getPendingOrdersCount = (req, res) => {
    try {
        const count = db.prepare("SELECT COUNT(*) as count FROM pedidos WHERE estado = 'pendiente'").get();
        res.json({ success: true, count: count.count });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error counting orders' });
    }
}
