// backend/migrate-add-stock-history.js
const db = require('./src/config/database');

(async () => {
  try {
    // Crea tabla de movimientos de stock (compatible con SQLite y PostgreSQL)
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS stock_movimientos (
        id INTEGER PRIMARY KEY ${process.env.DATABASE_URL ? '' : 'AUTOINCREMENT'},
        producto_id INTEGER NOT NULL,
        tipo TEXT NOT NULL CHECK (tipo IN ('INGRESO','SALIDA','AJUSTE')),
        cantidad INTEGER NOT NULL,
        stock_anterior INTEGER NOT NULL,
        stock_nuevo INTEGER NOT NULL,
        motivo TEXT,
        referencia_tipo TEXT,   -- 'VENTA', 'AJUSTE', 'COMPRA', etc.
        referencia_id INTEGER,  -- id relacionado (venta u otro)
        created_at ${process.env.DATABASE_URL ? 'TIMESTAMP DEFAULT NOW()' : 'TEXT DEFAULT CURRENT_TIMESTAMP'}
      )
    `).run();

    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_stock_mov_prod ON stock_movimientos(producto_id)`).run();
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_stock_mov_fecha ON stock_movimientos(created_at)`).run();
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_stock_mov_tipo ON stock_movimientos(tipo)`).run();

    console.log('✅ Tabla stock_movimientos creada y lista');
    process.exit(0);
  } catch (e) {
    console.error('❌ Error creando stock_movimientos:', e);
    process.exit(1);
  }
})();
