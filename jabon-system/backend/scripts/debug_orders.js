const path = require('path');
const dbPath = path.resolve('db/database_vieja.db');
const db = require('better-sqlite3')(dbPath);

console.log(`Checking DB at: ${dbPath}`);

console.log('--- DECEMBER 2025 ORDER QUANTITIES BY PRODUCT ---');
const stats = db.prepare(`
    SELECT pd.producto_id, p.nombre, SUM(pd.cantidad) as total_qty
    FROM pedidos_detalles pd
    JOIN pedidos ped ON ped.id = pd.pedido_id
    JOIN productos p ON p.id = pd.producto_id
    WHERE (ped.created_at LIKE '2025-12%' OR ped.fecha_entrega LIKE '2025-12%')
    AND pd.producto_id IN (1, 15, 12, 16, 20)
    GROUP BY pd.producto_id
`).all();

console.log(stats);
