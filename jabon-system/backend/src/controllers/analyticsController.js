const db = require('../config/database');

// 📊 Obtener Top Clientes
exports.getTopCustomers = (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, limit = 10 } = req.query;

    let query = `
      SELECT 
        c.id,
        c.nombre,
        c.telefono,
        COUNT(v.id) as total_compras,
        COALESCE(SUM(v.total), 0) as total_gastado,
        COALESCE(AVG(v.total), 0) as ticket_promedio,
        MAX(v.fecha) as ultima_compra,
        COALESCE(SUM(v.monto_pagado), 0) as total_pagado
      FROM clientes c
      INNER JOIN ventas v ON c.id = v.cliente_id
      WHERE c.activo = 1
    `;

    const params = [];

    if (fecha_inicio && fecha_fin) {
      query += ` AND DATE(v.fecha) BETWEEN ? AND ?`;
      params.push(fecha_inicio, fecha_fin);
    }

    query += `
      GROUP BY c.id
      ORDER BY total_pagado DESC
      LIMIT ?
    `;
    params.push(parseInt(limit));

    const topClients = db.prepare(query).all(...params);

    console.log('✅ Top clientes obtenidos:', topClients.length);

    res.json({ 
      success: true, 
      data: topClients 
    });

  } catch (error) {
    console.error('❌ Error obteniendo top clientes:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener top clientes' 
    });
  }
};

// 📦 Obtener Productos de Baja Rotación
exports.getLowRotationProducts = (req, res) => {
  try {
    const { days = 60 } = req.query;

    const query = `
      SELECT 
        p.id,
        p.nombre,
        p.tipo,
        p.presentacion,
        p.stock,
        p.precio_costo,
        p.precio_venta,
        COALESCE(ventas_data.ventas_periodo, 0) as ventas_periodo,
        (p.stock * p.precio_costo) as dinero_inmovilizado,
        ROUND((p.precio_venta - p.precio_costo) / p.precio_venta * 100, 2) as margen_porcentaje
      FROM productos p
      LEFT JOIN (
        SELECT 
          vd.producto_id,
          SUM(vd.cantidad) as ventas_periodo
        FROM ventas_detalles vd
        INNER JOIN ventas v ON vd.venta_id = v.id
        WHERE DATE(v.fecha) >= date('now', '-' || ? || ' days')
        GROUP BY vd.producto_id
      ) ventas_data ON p.id = ventas_data.producto_id
      WHERE p.activo = 1 AND p.stock > 0
      ORDER BY ventas_periodo ASC, dinero_inmovilizado DESC
      LIMIT 20
    `;

    const lowRotationProducts = db.prepare(query).all(days);

    console.log('✅ Productos de baja rotación obtenidos:', lowRotationProducts.length);

    res.json({ 
      success: true, 
      data: lowRotationProducts,
      period_days: parseInt(days)
    });

  } catch (error) {
    console.error('❌ Error obteniendo productos de baja rotación:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener productos de baja rotación' 
    });
  }
};

// 📈 Predicción de Ventas
exports.getSalesPrediction = (req, res) => {
  try {
    // Obtener ventas de los últimos 90 días agrupadas por día
    const salesData = db.prepare(`
      SELECT 
        DATE(fecha) as fecha,
        COUNT(*) as num_ventas,
        COALESCE(SUM(monto_pagado), 0) as total
      FROM ventas
      WHERE DATE(fecha) >= date('now', '-90 days')
      AND monto_pagado >= total
      GROUP BY DATE(fecha)
      ORDER BY fecha ASC
    `).all();

    // Calcular promedios y tendencias
    const totalSales = salesData.reduce((sum, day) => sum + day.total, 0);
    const avgDailySales = salesData.length > 0 ? totalSales / salesData.length : 0;
    
    // Ventas de últimos 30 días vs anteriores 30 días
    const last30Days = salesData.slice(-30);
    const previous30Days = salesData.slice(-60, -30);
    
    const last30Total = last30Days.reduce((sum, day) => sum + day.total, 0);
    const previous30Total = previous30Days.reduce((sum, day) => sum + day.total, 0);
    
    const growthRate = previous30Total > 0 
      ? ((last30Total - previous30Total) / previous30Total) * 100 
      : 0;

    // Proyección simple para próximo mes (30 días)
    const projectedNextMonth = avgDailySales * 30;
    const projectedWithGrowth = projectedNextMonth * (1 + (growthRate / 100));

    // Ventas del mes actual
    const currentMonthSales = db.prepare(`
      SELECT COALESCE(SUM(monto_pagado), 0) as total
      FROM ventas
      WHERE strftime('%Y-%m', fecha) = strftime('%Y-%m', 'now')
      AND monto_pagado >= total
    `).get();

    console.log('✅ Predicción de ventas calculada');

    res.json({
      success: true,
      data: {
        historical: {
          last_90_days: totalSales,
          last_30_days: last30Total,
          previous_30_days: previous30Total,
          current_month: currentMonthSales.total
        },
        averages: {
          daily_average: Math.round(avgDailySales),
          monthly_average: Math.round(avgDailySales * 30)
        },
        trends: {
          growth_rate: Math.round(growthRate * 100) / 100,
          trend: growthRate > 5 ? 'Creciente' : growthRate < -5 ? 'Decreciente' : 'Estable'
        },
        prediction: {
          next_month_base: Math.round(projectedNextMonth),
          next_month_adjusted: Math.round(projectedWithGrowth),
          confidence: salesData.length >= 60 ? 'Alta' : salesData.length >= 30 ? 'Media' : 'Baja'
        },
        chart_data: salesData.map(day => ({
          fecha: day.fecha,
          total: day.total,
          num_ventas: day.num_ventas
        }))
      }
    });

  } catch (error) {
    console.error('❌ Error calculando predicción de ventas:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al calcular predicción de ventas' 
    });
  }
};

// 💰 Margen de Ganancia por Categoría
exports.getProfitMarginByCategory = (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;

    // PASO 1: Obtener IDs de ventas pagadas QUE TIENEN DETALLES
    let ventasQuery = `
      SELECT DISTINCT v.id, v.total, v.monto_pagado
      FROM ventas v
      INNER JOIN ventas_detalles vd ON v.id = vd.venta_id
      WHERE v.monto_pagado >= v.total
    `;

    const ventasParams = [];
    if (fecha_inicio && fecha_fin) {
      ventasQuery += ` AND DATE(v.fecha) BETWEEN ? AND ?`;
      ventasParams.push(fecha_inicio, fecha_fin);
    }

    const ventasPagadas = db.prepare(ventasQuery).all(...ventasParams);
    
    // Si no hay ventas, retornar vacío
    if (ventasPagadas.length === 0) {
      return res.json({
        success: true,
        data: [],
        totals: {
          ingresos_totales: 0,
          costos_totales: 0,
          ganancia_neta: 0,
          unidades_vendidas: 0,
          margen_porcentaje: 0
        }
      });
    }

    const ventasIds = ventasPagadas.map(v => v.id);
    const placeholders = ventasIds.map(() => '?').join(',');

    // PASO 2: Obtener totales de ESAS ventas (usando v.total)
    const totalsQuery = `
      SELECT 
        COALESCE(SUM(v.total), 0) as ingresos_totales
      FROM ventas v
      WHERE v.id IN (${placeholders})
    `;
    
    const generalTotals = db.prepare(totalsQuery).get(...ventasIds);

    // PASO 3: Obtener costos y ganancias por categoría de esas MISMAS ventas
    const categoryQuery = `
      SELECT 
        p.tipo as categoria,
        COUNT(DISTINCT p.id) as num_productos,
        COALESCE(SUM(vd.cantidad), 0) as unidades_vendidas,
        COALESCE(SUM(vd.subtotal), 0) as ingresos_categoria,
        COALESCE(SUM(vd.cantidad * p.precio_costo), 0) as costos_categoria,
        COALESCE(SUM(vd.subtotal - (vd.cantidad * p.precio_costo)), 0) as ganancia_categoria
      FROM productos p
      INNER JOIN ventas_detalles vd ON p.id = vd.producto_id
      WHERE vd.venta_id IN (${placeholders})
      GROUP BY p.tipo
      ORDER BY ganancia_categoria DESC
    `;

    const margins = db.prepare(categoryQuery).all(...ventasIds);

    // PASO 4: Calcular totales sumando las categorías
    const costosTotales = margins.reduce((sum, cat) => sum + cat.costos_categoria, 0);
    const gananciaNeta = margins.reduce((sum, cat) => sum + cat.ganancia_categoria, 0);
    const unidadesVendidas = margins.reduce((sum, cat) => sum + cat.unidades_vendidas, 0);

    // PASO 5: Agregar porcentajes a cada categoría
    const marginsWithPercentage = margins.map(cat => ({
      categoria: cat.categoria,
      num_productos: cat.num_productos,
      unidades_vendidas: cat.unidades_vendidas,
      ingresos_totales: cat.ingresos_categoria,
      costos_totales: cat.costos_categoria,
      ganancia_neta: cat.ganancia_categoria,
      margen_porcentaje: cat.ingresos_categoria > 0 
        ? Math.round((cat.ganancia_categoria / cat.ingresos_categoria) * 100 * 100) / 100
        : 0
    }));

    // PASO 6: Totales generales
    const totals = {
      ingresos_totales: generalTotals.ingresos_totales,
      costos_totales: costosTotales,
      ganancia_neta: gananciaNeta,
      unidades_vendidas: unidadesVendidas,
      margen_porcentaje: generalTotals.ingresos_totales > 0
        ? Math.round((gananciaNeta / generalTotals.ingresos_totales) * 100 * 100) / 100
        : 0
    };

    console.log('✅ Márgenes por categoría calculados');
    console.log('📊 Ventas procesadas:', ventasPagadas.length);
    console.log('📊 Ingresos (v.total):', totals.ingresos_totales);
    console.log('📊 Costos:', totals.costos_totales);
    console.log('📊 Ganancia:', totals.ganancia_neta);
    console.log('📊 Margen %:', totals.margen_porcentaje);

    res.json({
      success: true,
      data: marginsWithPercentage,
      totals
    });

  } catch (error) {
    console.error('❌ Error calculando márgenes por categoría:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al calcular márgenes por categoría' 
    });
  }
};

module.exports = exports;
