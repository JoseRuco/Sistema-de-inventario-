const path = require('path');
const dbPath = path.resolve('db/database_vieja.db');
const db = require('better-sqlite3')(dbPath);

console.log('--- PRODUCT ID 1 vs 15 ---');
const products = db.prepare('SELECT id, nombre, presentacion, stock FROM productos WHERE id IN (1, 15)').all();
console.log(products);
