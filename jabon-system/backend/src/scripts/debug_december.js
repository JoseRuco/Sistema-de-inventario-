const path = require('path');
const dbPath = path.resolve('db/database_vieja.db');
const db = require('better-sqlite3')(dbPath);

console.log(`Checking DB at: ${dbPath}`);

console.log('--- DECEMBER 2025 SALES ---');
const decSales = db.prepare(`
    SELECT v.id, v.fecha, dp.nombre, dv.cantidad 
    FROM ventas v
    JOIN detalle_ventas dv ON dv.venta_id = v.id
    JOIN productos dp ON dp.id = dv.producto_id
    WHERE v.fecha LIKE '2025-12%'
    ORDER BY v.fecha DESC
`).all();

console.log(`Found ${decSales.length} entries for Dec 2025.`);
console.log(decSales);
