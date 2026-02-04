const db = require('../config/database');

const isPg = !!process.env.DATABASE_URL;

const toISODate = (d) => {
  if (!d || typeof d !== 'string') return null;
  const p = d.split('-');
  if (p.length !== 3) return null;
  let [dd, mm, yy] = p.map(s => s.trim());
  if (yy.length === 2) yy = `20${yy}`;
  return `${yy.padStart(4,'0')}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`;
};

// SOLO movimientos, con filtro por referencia_tipo=AJUSTE para cambios manuales
const getStockMovements = async (req, res) => {
  try {
    const {
      producto_id,
      tipo,
      presentacion, // ✅ NUEVO: Filtro por presentación
      fecha_inicio,
      fecha_fin,
      referencia_tipo = 'AJUSTE' // por defecto: solo ajustes manuales
    } = req.query;

    const dStart = toISODate(fecha_inicio);
    const dEnd = toISODate(fecha_fin);

    let q = `
      SELECT sm.*, p.nombre as producto_nombre, p.aroma as aroma, p.presentacion
      FROM stock_movimientos sm
      JOIN productos p ON p.id = sm.producto_id
      WHERE 1=1
    `;

    const params = [];

    if (producto_id) { 
      q += ` AND sm.producto_id = ?`; 
      params.push(producto_id); 
    }

    // ✅ NUEVO: Filtro por presentación
    if (presentacion) {
      q += ` AND p.presentacion = ?`;
      params.push(presentacion);
    }

    if (referencia_tipo) { 
      q += ` AND sm.referencia_tipo = ?`; 
      params.push(referencia_tipo); 
    }

    if (tipo && ['INGRESO','SALIDA','AJUSTE'].includes(tipo.toUpperCase())) {
      q += ` AND sm.tipo = ?`; 
      params.push(tipo.toUpperCase());
    }

    if (dStart && dEnd && dStart === dEnd) {
      if (isPg) q += ` AND sm.created_at::date = ?`; 
      else q += ` AND DATE(sm.created_at) = ?`;
      params.push(dStart);
    } else {
      if (dStart) { 
        if (isPg) q += ` AND sm.created_at::date >= ?`; 
        else q += ` AND DATE(sm.created_at) >= ?`; 
        params.push(dStart); 
      }
      if (dEnd) { 
        if (isPg) q += ` AND sm.created_at::date <= ?`; 
        else q += ` AND DATE(sm.created_at) <= ?`; 
        params.push(dEnd); 
      }
    }

    q += ` ORDER BY sm.created_at DESC, sm.id DESC`;

    const rows = await db.prepare(q).all(...params);

    const data = rows.map(r => ({
      ...r,
      cantidad: Number(r.cantidad),
      stock_anterior: Number(r.stock_anterior),
      stock_nuevo: Number(r.stock_nuevo),
      fecha: r.created_at // ✅ NUEVO: Agregar campo fecha desde created_at
    }));

    res.json(data);
  } catch (e) {
    console.error('❌ Error listando movimientos de stock:', e);
    res.status(500).json({ error: 'Error listando movimientos de stock' });
  }
};

module.exports = { getStockMovements };
