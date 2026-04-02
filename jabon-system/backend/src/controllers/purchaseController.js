const db = require('../config/database');
const { getColombiaDateTime } = require('../utils/dateHelper');

// Crear una nueva compra
exports.createPurchase = (req, res) => {
  try {
    const { numero_factura, proveedor, items, notas } = req.body;

    // Validaciones
    if (!numero_factura || !numero_factura.trim()) {
      return res.status(400).json({ success: false, error: 'El número de factura es obligatorio' });
    }
    if (!proveedor || !proveedor.trim()) {
      return res.status(400).json({ success: false, error: 'El proveedor es obligatorio' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'La imagen de la factura es obligatoria' });
    }

    // Parsear items (vienen como JSON string en FormData)
    let parsedItems;
    try {
      parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
    } catch (e) {
      return res.status(400).json({ success: false, error: 'Formato de ítems inválido' });
    }

    if (!parsedItems || !Array.isArray(parsedItems) || parsedItems.length === 0) {
      return res.status(400).json({ success: false, error: 'Debe agregar al menos un ítem' });
    }

    // Validar cada item
    for (let i = 0; i < parsedItems.length; i++) {
      const item = parsedItems[i];
      if (!item.nombre_insumo || !item.nombre_insumo.trim()) {
        return res.status(400).json({ success: false, error: `El ítem #${i + 1} requiere nombre del insumo` });
      }
      if (!item.cantidad || item.cantidad <= 0) {
        return res.status(400).json({ success: false, error: `El ítem #${i + 1} requiere cantidad válida` });
      }
      if (!item.precio_unitario || item.precio_unitario <= 0) {
        return res.status(400).json({ success: false, error: `El ítem #${i + 1} requiere precio unitario válido` });
      }
    }

    // Verificar que el número de factura no exista
    const existing = db.prepare('SELECT id FROM compras WHERE numero_factura = ?').get(numero_factura.trim());
    if (existing) {
      return res.status(400).json({ success: false, error: 'Ya existe una compra con ese número de factura' });
    }

    // Calcular total
    const total = parsedItems.reduce((sum, item) => {
      return sum + (parseFloat(item.cantidad) * parseFloat(item.precio_unitario));
    }, 0);

    // Ruta relativa de la imagen (sin el prefijo /api/)
    const imagenUrl = `/api/uploads/facturas/${req.file.filename}`;
    const fechaColombia = getColombiaDateTime();

    // Insertar compra
    const insertCompra = db.prepare(`
      INSERT INTO compras (numero_factura, fecha, proveedor, total, imagen_url, notas, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertCompra.run(
      numero_factura.trim(),
      fechaColombia,
      proveedor.trim(),
      total,
      imagenUrl,
      notas || '',
      fechaColombia
    );

    const compra_id = result.lastInsertRowid;

    // Insertar detalles
    const insertDetalle = db.prepare(`
      INSERT INTO compras_detalles (compra_id, nombre_insumo, cantidad, precio_unitario, subtotal)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const item of parsedItems) {
      const cantidad = parseFloat(item.cantidad);
      const precioUnitario = parseFloat(item.precio_unitario);
      const subtotal = cantidad * precioUnitario;
      insertDetalle.run(compra_id, item.nombre_insumo.trim(), cantidad, precioUnitario, subtotal);
    }

    res.json({
      success: true,
      message: 'Compra registrada exitosamente',
      compra_id,
      total
    });

  } catch (error) {
    console.error('Error creando compra:', error);
    if (error.message && error.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ success: false, error: 'Ya existe una compra con ese número de factura' });
    }
    res.status(500).json({ success: false, error: 'Error al registrar la compra' });
  }
};

// Obtener todas las compras con paginación y búsqueda
exports.getPurchases = (req, res) => {
  try {
    let { page = 1, limit = 20, search = '' } = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 20;
    const offset = (page - 1) * limit;

    const params = [];
    let whereClause = 'WHERE 1=1';

    if (search) {
      whereClause += ` AND (
        LOWER(c.numero_factura) LIKE LOWER(?)
        OR LOWER(c.proveedor) LIKE LOWER(?)
      )`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    // Contar total
    const countQuery = `SELECT COUNT(*) as total FROM compras c ${whereClause}`;
    const totalRecords = db.prepare(countQuery).get(...params).total;

    // Obtener registros paginados
    const dataQuery = `
      SELECT 
        c.id,
        c.numero_factura,
        c.fecha,
        c.proveedor,
        c.total,
        c.imagen_url,
        c.notas,
        c.created_at
      FROM compras c
      ${whereClause}
      ORDER BY c.fecha DESC
      LIMIT ? OFFSET ?
    `;

    const compras = db.prepare(dataQuery).all(...params, limit, offset);

    res.json({
      success: true,
      data: compras,
      pagination: {
        page,
        limit,
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit)
      }
    });

  } catch (error) {
    console.error('Error obteniendo compras:', error);
    res.status(500).json({ success: false, error: 'Error al obtener las compras' });
  }
};

// Obtener una compra específica con sus detalles
exports.getPurchase = (req, res) => {
  try {
    const { id } = req.params;

    const compra = db.prepare(`
      SELECT 
        c.id,
        c.numero_factura,
        c.fecha,
        c.proveedor,
        c.total,
        c.imagen_url,
        c.notas,
        c.created_at
      FROM compras c
      WHERE c.id = ?
    `).get(id);

    if (!compra) {
      return res.status(404).json({ success: false, error: 'Compra no encontrada' });
    }

    // Obtener detalles
    const detalles = db.prepare(`
      SELECT id, nombre_insumo, cantidad, precio_unitario, subtotal
      FROM compras_detalles
      WHERE compra_id = ?
    `).all(id);

    compra.detalles = detalles;

    res.json({ success: true, data: compra });

  } catch (error) {
    console.error('Error obteniendo compra:', error);
    res.status(500).json({ success: false, error: 'Error al obtener la compra' });
  }
};
