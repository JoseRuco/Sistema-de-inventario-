import sqlite3 from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../../database3.db');

// Elimina la base anterior si existe
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('🗑️ Base de datos anterior eliminada.');
}

const db = new sqlite3(dbPath);

// Crear tablas vacías con todas las columnas necesarias
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT,
      tipo TEXT,
      presentacion TEXT,
      marca TEXT,
      precio_compra REAL,
      precio_venta REAL,
      stock INTEGER DEFAULT 0,
      activo INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT,
      telefono TEXT,
      direccion TEXT
    );

    CREATE TABLE IF NOT EXISTS proveedores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT,
      contacto TEXT,
      telefono TEXT,
      direccion TEXT
    );

    CREATE TABLE IF NOT EXISTS ventas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER,
      fecha TEXT,
      total REAL,
      FOREIGN KEY (cliente_id) REFERENCES clientes(id)
    );

    CREATE TABLE IF NOT EXISTS detalle_ventas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venta_id INTEGER,
      producto_id INTEGER,
      cantidad INTEGER,
      subtotal REAL,
      FOREIGN KEY (venta_id) REFERENCES ventas(id),
      FOREIGN KEY (producto_id) REFERENCES productos(id)
    );

    CREATE TABLE IF NOT EXISTS compras (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      proveedor_id INTEGER,
      fecha TEXT,
      total REAL,
      FOREIGN KEY (proveedor_id) REFERENCES proveedores(id)
    );

    CREATE TABLE IF NOT EXISTS detalle_compras (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      compra_id INTEGER,
      producto_id INTEGER,
      cantidad INTEGER,
      subtotal REAL,
      FOREIGN KEY (compra_id) REFERENCES compras(id),
      FOREIGN KEY (producto_id) REFERENCES productos(id)
    );
  `);

  console.log('✅ Base de datos creada correctamente y vacía.');
} catch (err) {
  console.error('❌ Error al crear la base de datos:', err);
} finally {
  db.close();
}
