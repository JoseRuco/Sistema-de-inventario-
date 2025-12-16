const path = require('path');
const dbPath = path.resolve('db/database_vieja.db');
const db = require('better-sqlite3')(dbPath);

const id = 15;
console.log(`Checking DB at: ${dbPath}`);

console.log('--- PRODUCT 15 CHECKS ---');
const allDetails = db.prepare(`
    SELECT dv.id, v.fecha, dv.cantidad 
    FROM detalle_ventas dv 
    LEFT JOIN ventas v ON v.id = dv.venta_id 
    WHERE dv.producto_id = ?
    ORDER BY v.fecha DESC
`).all(id);


const orphans = allDetails.filter(d => !d.fecha);
const valid = allDetails.filter(d => d.fecha);

console.log(`Total Records: ${allDetails.length}`);
console.log(`Valid Records: ${valid.length}`);
console.log(`Orphan Records: ${orphans.length}`);

console.log('--- ORPHAN DATA ---');
console.log(orphans);

console.log('--- VALID DATA SAMPLE (Dates) ---');
console.log(valid.map(v => v.fecha).sort());

console.log('--- SUMS ---');
const totalQty = allDetails.reduce((sum, item) => sum + item.cantidad, 0);
const validQty = valid.reduce((sum, item) => sum + item.cantidad, 0);
const orphanQty = orphans.reduce((sum, item) => sum + item.cantidad, 0);

console.log(`Total Qty (All): ${totalQty}`);
console.log(`Valid Qty: ${validQty}`);
console.log(`Orphan Qty: ${orphanQty}`);
