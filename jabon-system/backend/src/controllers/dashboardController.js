const db = require('../config/database');

const { getColombiaDate, getColombiaYearMonth, getColombiaDateTime } = require('../utils/dateHelper');

// Función para obtener la fecha actual local (sin hora)
const getLocalDate = () => {
  return getColombiaDate();
};

// Función para obtener año-mes actual local
const getLocalYearMonth = () => {
  return getColombiaYearMonth();
};

// ✅ Generar array de fechas entre dos fechas (INCLUYE TODOS LOS DÍAS)
const generateDateRange = (startDate, endDate) => {
  const dates = [];
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
  const [endYear, endMonth, endDay] = endDate.split('-').map(Number);

  let year = startYear;
  let month = startMonth;
  let day = startDay;

  while (true) {
    const currentDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    dates.push(currentDate);

    if (year === endYear && month === endMonth && day === endDay) break;

    day++;
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day > daysInMonth) {
      day = 1;
      month++;
      if (month > 12) {
        month = 1;
        year++;
      }
    }
  }

  return dates;
};

const getDashboardStats = (req, res) => {
  try {
    const fechaHoy = getLocalDate();
    const mesActual = getLocalYearMonth();

    console.log('📅 Fecha hoy:', fechaHoy);
    console.log('📅 Mes actual:', mesActual);

    // Total de productos
    const totalProducts = db.prepare('SELECT COUNT(*) as count FROM productos WHERE activo = 1').get().count;

    // Total de clientes activos
    const totalClients = db.prepare('SELECT COUNT(*) as count FROM clientes WHERE activo = 1').get().count;

    // ✅ VENTAS DE HOY - Solo dinero pagado (100%)
    const salesToday = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(monto_pagado), 0) as total
      FROM ventas
      WHERE DATE(fecha) = ? AND monto_pagado >= total
    `).get(fechaHoy);

    // ✅ VENTAS DEL MES - Solo dinero pagado (100%)
    const salesMonth = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(monto_pagado), 0) as total
      FROM ventas
      WHERE strftime('%Y-%m', fecha) = ? AND monto_pagado >= total
    `).get(mesActual);

    // Productos con bajo stock (menos de 10 unidades) - SOLO ACTIVOS
    const lowStock = db.prepare(`
      SELECT id, nombre, aroma, presentacion, stock
      FROM productos
      WHERE stock < 10 AND activo = 1
      ORDER BY stock ASC
    `).all();

    // Ventas recientes (últimas 5)
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

    // ✅ VENTAS PENDIENTES DEL MES
    const pendingSalesCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM ventas
      WHERE strftime('%Y-%m', fecha) = ? AND estado_pago = 'pendiente'
    `).get(mesActual).count;

    // ✅ VENTAS PARCIALES DEL MES
    const partialSalesCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM ventas
      WHERE strftime('%Y-%m', fecha) = ? AND estado_pago = 'parcial'
    `).get(mesActual).count;

    console.log('✅ Stats calculados correctamente');
    console.log('📊 Ventas hoy:', salesToday);
    console.log('📊 Ventas mes:', salesMonth);

    res.json({
      totalProducts,
      totalClients,
      salesToday: {
        count: salesToday.count,
        total: salesToday.total
      },
      salesMonth: {
        count: salesMonth.count,
        total: salesMonth.total,
        pendingCount: pendingSalesCount, // Nuevo
        partialCount: partialSalesCount  // Nuevo
      },
      lowStock,
      recentSales
    });

  } catch (error) {
    console.error('❌ Error en getDashboardStats:', error);
    res.status(500).json({ error: error.message });
  }
};
const getChartData = (req, res) => {
  try {
    const fechaHoy = getColombiaDate();

    // 1. Para el Gráfico: ÚLTIMOS 30 DÍAS (ventana móvil)
    // Usamos el mediodía para evitar problemas de cambio de día al restar
    const dateObj = new Date(fechaHoy + 'T12:00:00');
    dateObj.setDate(dateObj.getDate() - 29);
    const fechaInicioChartStr = dateObj.toISOString().split('T')[0];

    // 2. Para Top Productos: DESDE EL 1 DEL MES ACTUAL (se reinicia)
    const [year, month] = fechaHoy.split('-');
    const fechaInicioMesStr = `${year}-${month}-01`;

    console.log('📊 Generando charts:', {
      grafico: { desde: fechaInicioChartStr, hasta: fechaHoy },
      topProductos: { desde: fechaInicioMesStr, hasta: fechaHoy }
    });

    // ✅ VENTAS POR DÍA - Solo ventas PAGADAS AL 100% (Últimos 30 días)
    const salesData = db.prepare(`
      SELECT DATE(fecha) as fecha,
             COUNT(*) as cantidad,
             SUM(monto_pagado) as total
      FROM ventas
      WHERE DATE(fecha) BETWEEN ? AND ?
      AND monto_pagado >= total
      GROUP BY DATE(fecha)
      ORDER BY DATE(fecha)
    `).all(fechaInicioChartStr, fechaHoy);

    const allDates = generateDateRange(fechaInicioChartStr, fechaHoy);

    const salesByDay = allDates.map(date => {
      const found = salesData.find(s => s.fecha === date);
      return {
        fecha: new Date(date + 'T00:00:00').toLocaleDateString('es-CO', {
          month: 'short',
          day: 'numeric'
        }),
        ventas: found ? found.cantidad : 0,
        ingresos: found ? found.total : 0
      };
    });

    // Top productos más vendidos (Solo de ventas PAGADAS - Mes Actual)
    const topProducts = db.prepare(`
      SELECT 
        p.nombre,
        p.aroma,
        p.presentacion,
        COALESCE(SUM(vd.cantidad), 0) as cantidad_vendida,
        COALESCE(SUM(vd.subtotal * (CAST(vd.v_total AS REAL) / (vd.v_total + vd.v_descuento))), 0) as total_vendido
      FROM productos p
      LEFT JOIN (
        SELECT vd.producto_id, vd.cantidad, vd.subtotal, v.total as v_total, v.descuento as v_descuento
        FROM ventas_detalles vd
        INNER JOIN ventas v ON vd.venta_id = v.id
        WHERE v.monto_pagado >= v.total
        AND DATE(v.fecha) BETWEEN ? AND ?
      ) vd ON vd.producto_id = p.id
      WHERE p.activo = 1
      GROUP BY p.id
      ORDER BY cantidad_vendida DESC
    `).all(fechaInicioMesStr, fechaHoy);

    console.log('✅ Charts generados correctamente');

    res.json({
      salesByDay,
      topProducts
    });

  } catch (error) {
    console.error('❌ Error en getChartData:', error);
    res.status(500).json({ error: error.message });
  }
};

const getReports = (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, tipo } = req.query;

    console.log('📊 Generando reporte:', { fecha_inicio, fecha_fin, tipo });

    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({
        error: 'Se requieren fecha_inicio y fecha_fin'
      });
    }

    if (tipo === 'ventas') {
      // ✅ REPORTE DE VENTAS DETALLADAS - TODAS LAS VENTAS (pagadas y sin pagar)
      const salesData = db.prepare(`
        SELECT 
          v.id,
          v.fecha,
          v.total,
          v.descuento,
          v.monto_pagado,
          v.estado_pago,
          c.nombre as cliente_nombre,
          COALESCE(SUM(vd.subtotal), 0) as subtotal_productos,
          COALESCE(SUM(vd.subtotal - (vd.cantidad * p.precio_costo)) - v.descuento, 0) as ganancia
        FROM ventas v
        LEFT JOIN clientes c ON v.cliente_id = c.id
        LEFT JOIN ventas_detalles vd ON v.id = vd.venta_id
        LEFT JOIN productos p ON vd.producto_id = p.id
        WHERE DATE(v.fecha) BETWEEN ? AND ?
        GROUP BY v.id
        ORDER BY v.fecha DESC
      `).all(fecha_inicio, fecha_fin);

      // Calcular totales solo de ventas PAGADAS
      const paidSales = salesData.filter(sale => sale.monto_pagado >= sale.total);
      const totalVentas = paidSales.length;
      const totalIngresos = paidSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
      const totalDescuentos = paidSales.reduce((sum, sale) => sum + (sale.descuento || 0), 0);
      const totalGanancias = paidSales.reduce((sum, sale) => sum + (sale.ganancia || 0), 0);

      console.log('✅ Reporte de ventas generado:', { totalVentas, totalIngresos, totalGanancias });

      res.json({
        tipo: 'ventas',
        fecha_inicio,
        fecha_fin,
        totalVentas,
        totalIngresos,
        totalDescuentos,
        totalGanancias,
        data: salesData // Incluye TODAS las ventas
      });

    } else if (tipo === 'ganancias') {
      // ✅ Reporte de ganancias - Solo ventas PAGADAS AL 100%
      // CORRECCIÓN: Usamos subconsulta para evitar duplicar v.total por cada producto
      const profitData = db.prepare(`
        SELECT 
          fecha,
          COUNT(id) as num_ventas,
          SUM(total_venta) as ingresos,
          SUM(costo_venta) as costos,
          SUM(total_venta - costo_venta) as ganancia
        FROM (
          SELECT 
            DATE(v.fecha) as fecha,
            v.id,
            v.total as total_venta,
            COALESCE(SUM(vd.cantidad * p.precio_costo), 0) as costo_venta
          FROM ventas v
          LEFT JOIN ventas_detalles vd ON v.id = vd.venta_id
          LEFT JOIN productos p ON vd.producto_id = p.id
          WHERE DATE(v.fecha) BETWEEN ? AND ?
          AND v.monto_pagado >= v.total
          GROUP BY v.id
        )
        GROUP BY fecha
        ORDER BY fecha
      `).all(fecha_inicio, fecha_fin);

      // ✅ Generar rango completo de fechas (incluyendo días sin ventas)
      const allDates = generateDateRange(fecha_inicio, fecha_fin);

      // ✅ Combinar datos reales con días sin ventas (valores en 0)
      const completeData = allDates.map(date => {
        const found = profitData.find(day => day.fecha === date);
        return {
          fecha: date,
          num_ventas: found ? found.num_ventas : 0,
          ingresos: found ? found.ingresos : 0,
          costos: found ? found.costos : 0,
          ganancia: found ? found.ganancia : 0
        };
      });

      // ✅ CALCULAR TOTALES CON CONSULTAS SEPARADAS (Mayor precisión)

      // 1. Total Ventas e Ingresos (Solo PAGADAS)
      const salesStats = db.prepare(`
        SELECT 
          COUNT(*) as total_ventas,
          COALESCE(SUM(total), 0) as total_ingresos,
          COALESCE(SUM(descuento), 0) as total_descuentos
        FROM ventas
        WHERE DATE(fecha) BETWEEN ? AND ?
        AND monto_pagado >= total
      `).get(fecha_inicio, fecha_fin);

      // 2. Total Costos y Ganancias (Solo PAGADAS)
      const profitStats = db.prepare(`
        SELECT 
          COALESCE(SUM(vd.cantidad * p.precio_costo), 0) as total_costos,
          COALESCE(SUM(vd.subtotal - (vd.cantidad * p.precio_costo)), 0) as total_ganancias
        FROM ventas_detalles vd
        INNER JOIN ventas v ON vd.venta_id = v.id
        LEFT JOIN productos p ON vd.producto_id = p.id
        WHERE DATE(v.fecha) BETWEEN ? AND ?
        AND v.monto_pagado >= v.total
      `).get(fecha_inicio, fecha_fin);

      const totalVentas = salesStats.total_ventas;
      const totalIngresos = salesStats.total_ingresos;
      const totalDescuentos = salesStats.total_descuentos;
      const totalCostos = profitStats.total_costos;
      // La ganancia real debe considerar el descuento:
      // ganancia = (ingresos items - costos) - descuentos totales
      const totalGanancias = profitStats.total_ganancias - totalDescuentos;

      // 3. Contar ventas sin pagar (pendientes o parciales)
      const unpaidCount = db.prepare(`
        SELECT COUNT(*) as count
        FROM ventas
        WHERE DATE(fecha) BETWEEN ? AND ?
        AND (estado_pago = 'pendiente' OR estado_pago = 'parcial')
      `).get(fecha_inicio, fecha_fin);

      console.log('✅ Reporte de ganancias generado:', { totalVentas, totalIngresos, totalCostos, totalGanancias, unpaidSales: unpaidCount.count });

      res.json({
        tipo: 'ganancias',
        fecha_inicio,
        fecha_fin,
        totalVentas,
        totalIngresos,
        totalDescuentos,
        totalCostos,
        totalGanancias,
        unpaidSales: unpaidCount.count, // Agregar contador de ventas sin pagar
        data: completeData.map(day => ({
          fecha: day.fecha,
          num_ventas: day.num_ventas,
          total_ventas: day.ingresos || 0,
          ganancia_total: day.ganancia || 0,
          ingresos: day.ingresos || 0,
          costos: day.costos || 0,
          ganancia: day.ganancia || 0
        }))
      });

    } else {
      res.status(400).json({ error: 'Tipo de reporte inválido. Use "ventas" o "ganancias"' });
    }

  } catch (error) {
    console.error('❌ Error en getReports:', error);
    res.status(500).json({ error: error.message });
  }
};

const getTopProductsByDateRange = (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;

    console.log('📊 getTopProductsByDateRange - Parámetros:', { fecha_inicio, fecha_fin });

    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({
        error: 'Se requieren fecha_inicio y fecha_fin'
      });
    }

    // ✅ SOLUCIÓN FINAL: Filtrar ventas_detalles por fecha usando subquery
    // Y filtrar SOLO ventas PAGADAS AL 100%
    const allProducts = db.prepare(`
      SELECT 
        p.id,
        p.nombre,
        p.aroma,
        p.presentacion,
        p.precio_costo,
        COALESCE(SUM(vd.cantidad), 0) as total_vendido,
        COALESCE(SUM(vd.subtotal * (CAST(vd.v_total AS REAL) / (vd.v_total + vd.v_descuento))), 0) as total_ingresos,
        COALESCE(SUM((vd.subtotal * (CAST(vd.v_total AS REAL) / (vd.v_total + vd.v_descuento))) - (vd.cantidad * p.precio_costo)), 0) as ganancia_total
      FROM productos p
      LEFT JOIN (
        SELECT vd.producto_id, vd.cantidad, vd.subtotal, v.total as v_total, v.descuento as v_descuento
        FROM ventas_detalles vd
        INNER JOIN ventas v ON vd.venta_id = v.id
        WHERE DATE(v.fecha) BETWEEN ? AND ?
        AND v.monto_pagado >= v.total
      ) vd ON vd.producto_id = p.id
      WHERE p.activo = 1
      GROUP BY p.id
      ORDER BY total_vendido DESC
    `).all(fecha_inicio, fecha_fin);

    console.log('✅ Productos encontrados:', allProducts.length);

    res.json(allProducts);

  } catch (error) {
    console.error('❌ Error en getTopProductsByDateRange:', error);
    res.status(500).json({ error: error.message });
  }
};

const getSalesByTypeThisMonth = (req, res) => {
  try {
    const fechaHoy = getColombiaDate();
    const [year, month] = fechaHoy.split('-');
    const fechaInicioStr = `${year}-${month}-01`;

    // ✅ Ventas por tipo - Solo PAGADAS y del MES ACTUAL
    const salesByType = db.prepare(`
      SELECT 
        p.aroma,
        SUM(vd.cantidad) as cantidad_vendida
      FROM ventas v
      INNER JOIN ventas_detalles vd ON v.id = vd.venta_id
      INNER JOIN productos p ON vd.producto_id = p.id
      WHERE p.activo = 1
        AND DATE(v.fecha) BETWEEN ? AND ?
        AND v.monto_pagado >= v.total
      GROUP BY p.aroma
      ORDER BY cantidad_vendida DESC
    `).all(fechaInicioStr, fechaHoy);
    res.json({ salesByType });
  } catch (error) {
    console.error('❌ Error en getSalesByTypeThisMonth:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getChartData,
  getReports,
  getTopProductsByDateRange,
  getSalesByTypeThisMonth
};
