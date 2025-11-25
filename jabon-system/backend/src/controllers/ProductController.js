const db = require('../config/database');
const { getColombiaDateTime } = require('../utils/dateHelper');

// Obtener todos los productos (solo activos)
const getAllProducts = (req, res) => {
  try {
    const products = db.prepare('SELECT * FROM productos WHERE activo = 1 ORDER BY created_at DESC').all();
    res.json(products);
  } catch (error) {
    console.error('❌ Error en getAllProducts:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener un producto por ID
const getProductById = (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM productos WHERE id = ?').get(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(product);
  } catch (error) {
    console.error('❌ Error en getProductById:', error);
    res.status(500).json({ error: error.message });
  }
};

// Crear nuevo producto
const createProduct = (req, res) => {
  try {
    const { nombre, tipo, presentacion, precio_costo, precio_venta, stock } = req.body;

    const stmt = db.prepare(`
      INSERT INTO productos (nombre, tipo, presentacion, precio_costo, precio_venta, stock, activo)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);

    const result = stmt.run(nombre, tipo, presentacion, precio_costo, precio_venta, stock || 0);

    // Registrar el stock inicial si es mayor a 0
    if (stock && stock > 0) {
      db.prepare(`
        INSERT INTO stock_movimientos
        (producto_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo, referencia_tipo, referencia_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        result.lastInsertRowid,
        'INGRESO',
        stock,
        0,
        stock,
        'Stock inicial al crear producto',
        'AJUSTE',
        null,
        getColombiaDateTime()
      );
    }

    const newProduct = db.prepare('SELECT * FROM productos WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('❌ Error en createProduct:', error);
    res.status(500).json({ error: error.message });
  }
};

// Actualizar producto
const updateProduct = (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Obtener el producto actual
    const currentProduct = db.prepare('SELECT * FROM productos WHERE id = ?').get(id);

    if (!currentProduct) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Fusionar datos actuales con las actualizaciones
    const updatedData = {
      nombre: updates.nombre !== undefined ? updates.nombre : currentProduct.nombre,
      tipo: updates.tipo !== undefined ? updates.tipo : currentProduct.tipo,
      presentacion: updates.presentacion !== undefined ? updates.presentacion : currentProduct.presentacion,
      precio_costo: updates.precio_costo !== undefined ? updates.precio_costo : currentProduct.precio_costo,
      precio_venta: updates.precio_venta !== undefined ? updates.precio_venta : currentProduct.precio_venta,
      stock: updates.stock !== undefined ? parseInt(updates.stock) : currentProduct.stock
    };

    // Actualizar el producto
    const stmt = db.prepare(`
      UPDATE productos 
      SET nombre = ?, tipo = ?, presentacion = ?, precio_costo = ?, precio_venta = ?, stock = ?
      WHERE id = ?
    `);

    stmt.run(
      updatedData.nombre,
      updatedData.tipo,
      updatedData.presentacion,
      updatedData.precio_costo,
      updatedData.precio_venta,
      updatedData.stock,
      id
    );

    // Registrar cambio de stock si hubo modificación
    if (updatedData.stock !== currentProduct.stock) {
      const delta = updatedData.stock - currentProduct.stock;
      const motivo = delta > 0
        ? `Ajuste de inventario: +${delta} unidades`
        : `Ajuste de inventario: ${delta} unidades`;

      const tipo = delta > 0 ? 'INGRESO' : 'SALIDA';

      db.prepare(`
        INSERT INTO stock_movimientos
        (producto_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo, referencia_tipo, referencia_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        tipo,
        Math.abs(delta),
        currentProduct.stock,
        updatedData.stock,
        motivo,
        'AJUSTE',
        null,
        getColombiaDateTime()
      );
    }

    const updatedProduct = db.prepare('SELECT * FROM productos WHERE id = ?').get(id);
    res.json(updatedProduct);
  } catch (error) {
    console.error('❌ Error en updateProduct:', error);
    res.status(500).json({ error: error.message });
  }
};

// Eliminar producto (desactivar)
const deleteProduct = (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el producto tiene ventas
    const hasSales = db.prepare(`
      SELECT COUNT(*) as count 
      FROM detalle_ventas 
      WHERE producto_id = ?
    `).get(id);

    if (hasSales.count > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar',
        message: 'Producto con ventas registradas',
        details: 'Este producto tiene ventas asociadas y no puede ser eliminado.'
      });
    }

    const stmt = db.prepare('UPDATE productos SET activo = 0 WHERE id = ?');
    stmt.run(id);

    res.json({ message: 'Producto desactivado correctamente' });
  } catch (error) {
    console.error('❌ Error en deleteProduct:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener estadísticas de un producto (MEJORADO)
const getProductStats = (req, res) => {
  try {
    const { id } = req.params;

    // Obtener fecha de inicio del mes actual
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayString = firstDayOfMonth.toISOString().split('T')[0];

    // Estadísticas del mes actual
    const monthStats = db.prepare(`
      SELECT 
        COALESCE(SUM(dv.cantidad), 0) as cantidad,
        COALESCE(SUM(dv.subtotal), 0) as total
      FROM detalle_ventas dv
      JOIN ventas v ON v.id = dv.venta_id
      WHERE dv.producto_id = ?
        AND DATE(v.fecha) >= ?
    `).get(id, firstDayString);

    // Estadísticas históricas (totales)
    const totalStats = db.prepare(`
      SELECT 
        p.id,
        p.nombre,
        p.stock,
        COALESCE(SUM(dv.cantidad), 0) as cantidad,
        COALESCE(SUM(dv.subtotal), 0) as total,
        COUNT(DISTINCT dv.venta_id) as num_ventas
      FROM productos p
      LEFT JOIN detalle_ventas dv ON dv.producto_id = p.id
      WHERE p.id = ?
      GROUP BY p.id
    `).get(id);

    if (!totalStats) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Estructura de respuesta
    const response = {
      id: totalStats.id,
      nombre: totalStats.nombre,
      stock: totalStats.stock,
      monthSales: {
        cantidad: monthStats.cantidad || 0,
        total: monthStats.total || 0
      },
      totalSales: {
        cantidad: totalStats.cantidad || 0,
        total: totalStats.total || 0
      },
      num_ventas: totalStats.num_ventas || 0
    };

    res.json(response);
  } catch (error) {
    console.error('❌ Error en getProductStats:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStats
};
