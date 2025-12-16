const path = require('path');
const dbPath = path.resolve('db/database_vieja.db');
const db = require('better-sqlite3')(dbPath);

console.log(`Checking DB at: ${dbPath}`);

console.log('--- SEARCHING PRODUCTS (loza) ---');
const products = db.prepare("SELECT * FROM productos WHERE nombre LIKE '%loza%' OR nombre LIKE '%jabon%'").all();

console.log(`Found ${products.length} products:`);
products.forEach(p => {
    const stats = db.prepare(`
        SELECT COALESCE(SUM(dv.cantidad), 0) as total_qty 
        FROM detalle_ventas dv 
        WHERE dv.producto_id = ?
    `).get(p.id);
    
    console.log(`[ID: ${p.id}] ${p.nombre} (Stock: ${p.stock}) -> Sales Qty: ${stats.total_qty}`);
});
