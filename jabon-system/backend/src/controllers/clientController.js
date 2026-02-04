const db = require('../config/database');

// Obtener todos los clientes (solo activos)
const getAllClients = (req, res) => {
  try {
    const clients = db.prepare('SELECT * FROM clientes WHERE activo = 1 ORDER BY created_at DESC').all();
    res.json(clients);
  } catch (error) {
    console.error('❌ Error en getAllClients:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener un cliente por ID
const getClientById = (req, res) => {
  try {
    const client = db.prepare('SELECT * FROM clientes WHERE id = ?').get(req.params.id);
    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json(client);
  } catch (error) {
    console.error('❌ Error en getClientById:', error);
    res.status(500).json({ error: error.message });
  }
};

// Crear nuevo cliente (✅ CON VALIDACIÓN DE DUPLICADOS)
const createClient = (req, res) => {
  try {
    const { nombre, telefono, correo, direccion } = req.body;

    // ✅ NUEVO: Validar que el nombre no esté vacío
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ 
        error: 'Nombre requerido',
        message: 'El nombre del cliente es obligatorio'
      });
    }

    // ✅ NUEVO: Verificar si ya existe un cliente con ese nombre (activo)
    const existingClient = db.prepare(
      'SELECT id, nombre FROM clientes WHERE LOWER(TRIM(nombre)) = LOWER(TRIM(?)) AND activo = 1'
    ).get(nombre);

    if (existingClient) {
      return res.status(409).json({ 
        error: 'Cliente duplicado',
        message: `Ya existe un cliente con el nombre "${existingClient.nombre}"`,
        existingClientId: existingClient.id
      });
    }

    // Si no existe duplicado, crear el cliente
    const stmt = db.prepare(`
      INSERT INTO clientes (nombre, telefono, correo, direccion, activo)
      VALUES (?, ?, ?, ?, 1)
    `);

    const result = stmt.run(nombre.trim(), telefono, correo, direccion);
    const newClient = db.prepare('SELECT * FROM clientes WHERE id = ?').get(result.lastInsertRowid);
    
    res.status(201).json(newClient);
  } catch (error) {
    console.error('❌ Error en createClient:', error);
    res.status(500).json({ error: error.message });
  }
};

// Actualizar cliente
const updateClient = (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, telefono, correo, direccion } = req.body;

    // ✅ PROTECCIÓN: No permitir editar el Cliente General
    if (parseInt(id) === 1) {
      return res.status(403).json({
        error: 'Cliente protegido',
        message: 'No se puede editar el Cliente General',
        details: 'Este es un cliente del sistema y no puede ser modificado'
      });
    }

    // ✅ NUEVO: Validar que el nombre no esté vacío
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ 
        error: 'Nombre requerido',
        message: 'El nombre del cliente es obligatorio'
      });
    }

    // ✅ NUEVO: Verificar si existe otro cliente con ese nombre (excluyendo el actual)
    const existingClient = db.prepare(
      'SELECT id, nombre FROM clientes WHERE LOWER(TRIM(nombre)) = LOWER(TRIM(?)) AND activo = 1 AND id != ?'
    ).get(nombre, id);

    if (existingClient) {
      return res.status(409).json({ 
        error: 'Cliente duplicado',
        message: `Ya existe otro cliente con el nombre "${existingClient.nombre}"`,
        existingClientId: existingClient.id
      });
    }

    const stmt = db.prepare(`
      UPDATE clientes 
      SET nombre = ?, telefono = ?, correo = ?, direccion = ?
      WHERE id = ?
    `);

    stmt.run(nombre.trim(), telefono, correo, direccion, id);
    const updatedClient = db.prepare('SELECT * FROM clientes WHERE id = ?').get(id);
    
    res.json(updatedClient);
  } catch (error) {
    console.error('❌ Error en updateClient:', error);
    res.status(500).json({ error: error.message });
  }
};

// Eliminar cliente (desactivar)
const deleteClient = (req, res) => {
  try {
    const { id } = req.params;

    // ✅ PROTECCIÓN: No permitir eliminar el Cliente General
    if (parseInt(id) === 1) {
      return res.status(403).json({
        error: 'Cliente protegido',
        message: 'No se puede eliminar el Cliente General',
        details: 'Este es un cliente del sistema y debe permanecer activo'
      });
    }

    // Verificar si el cliente tiene ventas
    const hasSales = db.prepare(`
      SELECT COUNT(*) as count 
      FROM ventas 
      WHERE cliente_id = ?
    `).get(id);

    if (hasSales.count > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar',
        message: 'Cliente con ventas registradas',
        details: 'Este cliente tiene ventas asociadas y no puede ser eliminado.'
      });
    }

    const stmt = db.prepare('UPDATE clientes SET activo = 0 WHERE id = ?');
    stmt.run(id);

    res.json({ message: 'Cliente desactivado correctamente' });
  } catch (error) {
    console.error('❌ Error en deleteClient:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener historial de compras de un cliente
const getClientPurchaseHistory = (req, res) => {
  try {
    const { id } = req.params;

    // Obtener datos del cliente
    const client = db.prepare('SELECT * FROM clientes WHERE id = ?').get(id);
    
    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Obtener ventas del cliente con detalles
const sales = db.prepare(`
      SELECT 
        v.id,
        v.fecha,
        v.total,
        v.descuento,
        v.metodo_pago,
        v.estado_pago,
        v.monto_pagado,
        v.monto_pendiente
      FROM ventas v
      WHERE v.cliente_id = ?
      ORDER BY v.fecha DESC
    `).all(id);

    // Para cada venta, obtener sus productos
    const salesWithDetails = sales.map(sale => {
      const detalles = db.prepare(`
        SELECT 
          vd.cantidad,
          vd.precio_unitario,
          vd.subtotal,
          p.nombre as producto_nombre,
          p.aroma,
          p.presentacion
        FROM ventas_detalles vd
        INNER JOIN productos p ON vd.producto_id = p.id
        WHERE vd.venta_id = ?
      `).all(sale.id);

      return {
        ...sale,
        productos: detalles
      };
    });

    res.json({
      client,
      sales: salesWithDetails
    });

  } catch (error) {
    console.error('❌ Error en getClientPurchaseHistory:', error);
    res.status(500).json({ error: error.message });
  }
};


module.exports = {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  getClientPurchaseHistory
};
