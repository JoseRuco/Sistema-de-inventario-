import sqlite3 from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta a tu base actual
const dbPath = path.resolve(__dirname, '../../database3.db');
const db = new sqlite3(dbPath);

try {
  // Verifica y agrega columna 'activo'
  const columns = db.prepare(`PRAGMA table_info(productos);`).all();
  const hasActivo = columns.some(col => col.name === 'activo');
  const hasTipo = columns.some(col => col.name === 'tipo');

  if (!hasActivo) {
    db.exec(`ALTER TABLE productos ADD COLUMN activo INTEGER DEFAULT 1;`);
    console.log('🟢 Columna "activo" agregada a productos.');
  }

  if (!hasTipo) {
    db.exec(`ALTER TABLE productos ADD COLUMN tipo TEXT;`);
    console.log('🟢 Columna "tipo" agregada a productos.');
  }

  console.log('✅ Estructura actualizada correctamente.');
} catch (err) {
  console.error('❌ Error al actualizar la base:', err);
} finally {
  db.close();
}
