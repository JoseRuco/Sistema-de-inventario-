const db = require('../config/database');

// Función para obtener la fecha actual local (sin hora)
const getLocalDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Función para obtener año-mes actual local
const getLocalYearMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
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
      SELECT id, nombre, tipo, presentacion, stock
      FROM productos
      WHERE stock < 10 AND activo = 1
      ORDER BY stock ASC
      LIMIT 5
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
        total: salesMonth.total
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
    const fechaHoy = getLocalDate();
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const fechaInicioStr = `${year}-${month}-01`;

    console.log('📊 Generando charts desde:', fechaInicioStr, 'hasta:', fechaHoy);

    // ✅ VENTAS POR DÍA - Solo ventas PAGADAS AL 100%
    const salesData = db.prepare(`
      SELECT DATE(fecha) as fecha,
             COUNT(*) as cantidad,
             SUM(monto_pagado) as total
      FROM ventas
      WHERE DATE(fecha) BETWEEN ? AND ?
      AND monto_pagado >= total
      GROUP BY DATE(fecha)
      ORDER BY DATE(fecha)
    `).all(fechaInicioStr, fechaHoy);

    const allDates = generateDateRange(fechaInicioStr, fechaHoy);

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

    // Top productos más vendidos (Solo de ventas PAGADAS)
    const topProducts = db.prepare(`
      SELECT 
        p.nombre,
        p.tipo,
        p.presentacion,
        COALESCE(SUM(vd.cantidad), 0) as cantidad_vendida,
        COALESCE(SUM(vd.subtotal), 0) as total_vendido
      FROM productos p
      LEFT JOIN (
        SELECT vd.producto_id, vd.cantidad, vd.subtotal
        FROM ventas_detalles vd
        INNER JOIN ventas v ON vd.venta_id = v.id
        WHERE v.monto_pagado >= v.total
        AND DATE(v.fecha) BETWEEN ? AND ?
      ) vd ON vd.producto_id = p.id
      WHERE p.activo = 1
      GROUP BY p.id
      ORDER BY cantidad_vendida DESC
    `).all(fechaInicioStr, fechaHoy);

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
          v.monto_pagado,
          v.estado_pago,
          c.nombre as cliente_nombre,
          COALESCE(SUM(vd.subtotal - (vd.cantidad * p.precio_costo)), 0) as ganancia
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
      const totalGanancias = paidSales.reduce((sum, sale) => sum + (sale.ganancia || 0), 0);

      console.log('✅ Reporte de ventas generado:', { totalVentas, totalIngresos, totalGanancias });

      res.json({
        tipo: 'ventas',
        fecha_inicio,
        fecha_fin,
        totalVentas,
        totalIngresos,
        totalGanancias,
        data: salesData // Incluye TODAS las ventas
      });

    } else if (tipo === 'ganancias') {
      // ✅ Reporte de ganancias - Solo ventas PAGADAS AL 100%
      const profitData = db.prepare(`
        SELECT 
          DATE(v.fecha) as fecha,
          COUNT(DISTINCT v.id) as num_ventas,
          SUM(vd.subtotal) as ingresos,
          SUM(vd.cantidad * p.precio_costo) as costos,
          SUM(vd.subtotal - (vd.cantidad * p.precio_costo)) as ganancia
        FROM ventas v
        LEFT JOIN ventas_detalles vd ON v.id = vd.venta_id
        LEFT JOIN productos p ON vd.producto_id = p.id
        WHERE DATE(v.fecha) BETWEEN ? AND ?
        AND v.monto_pagado >= v.total
        GROUP BY DATE(v.fecha)
        ORDER BY DATE(v.fecha)
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
          COALESCE(SUM(total), 0) as total_ingresos
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
      const totalCostos = profitStats.total_costos;
      const totalGanancias = profitStats.total_ganancias;

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
        p.tipo,
        p.presentacion,
        p.precio_costo,
        COALESCE(SUM(vd.cantidad), 0) as total_vendido,
        COALESCE(SUM(vd.subtotal), 0) as total_ingresos,
        COALESCE(SUM(vd.subtotal - (vd.cantidad * p.precio_costo)), 0) as ganancia_total
      FROM productos p
      LEFT JOIN (
        SELECT vd.producto_id, vd.cantidad, vd.subtotal
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
    const getLocalDate = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const fechaHoy = getLocalDate();
    const [year, month] = fechaHoy.split('-');
    const fechaInicioStr = `${year}-${month}-01`;

    // ✅ Ventas por tipo - Solo PAGADAS y del MES ACTUAL
    const salesByType = db.prepare(`
      SELECT 
        p.tipo,
        SUM(vd.cantidad) as cantidad_vendida
      FROM ventas v
      INNER JOIN ventas_detalles vd ON v.id = vd.venta_id
      INNER JOIN productos p ON vd.producto_id = p.id
      WHERE p.activo = 1
        AND DATE(v.fecha) BETWEEN ? AND ?
        AND v.monto_pagado >= v.total
      GROUP BY p.tipo
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
