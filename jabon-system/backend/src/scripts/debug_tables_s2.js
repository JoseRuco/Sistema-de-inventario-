const path = require('path');
const dbPath = path.resolve('db/database_vieja.db');
const db = require('better-sqlite3')(dbPath);

const id = 1;
console.log(`Checking DB at: ${dbPath} for Product ID: ${id}`);

// Legacy Table
const legacyStats = db.prepare(`
    SELECT COUNT(*) as count, SUM(cantidad) as qty 
    FROM detalle_ventas WHERE producto_id = ?
`).get(id);

// New Table
const newStats = db.prepare(`
    SELECT COUNT(*) as count, SUM(cantidad) as qty 
    FROM ventas_detalles WHERE producto_id = ?
`).get(id);

console.log('--- LEGACY (detalle_ventas) ---');
console.log(legacyStats);

console.log('--- NEW (ventas_detalles) ---');
console.log(newStats);

// Check if reports sum them?
console.log(`Sum of Qty: ${(legacyStats.qty || 0) + (newStats.qty || 0)}`);
