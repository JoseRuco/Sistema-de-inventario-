const path = require('path');
const dbPath = path.resolve('db/database_vieja.db');
const db = require('better-sqlite3')(dbPath);

console.log('--- PAYMENT STATUSES ---');
const statuses = db.prepare('SELECT estado_pago, count(*) as count FROM ventas GROUP BY estado_pago').all();
console.log(statuses);

console.log('--- SAMPLE PARTIAL SALES ---');
const partials = db.prepare('SELECT id, total, monto_pagado, monto_pendiente FROM ventas WHERE estado_pago = "parcial" LIMIT 5').all();
console.log(partials);
