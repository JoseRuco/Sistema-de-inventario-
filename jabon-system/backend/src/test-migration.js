const Database = require('better-sqlite3');

const db = new Database(':memory:');

db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE productos (
    id INTEGER PRIMARY KEY,
    tipo TEXT
  );
  
  CREATE TABLE ventas_detalles (
    id INTEGER PRIMARY KEY,
    producto_id INTEGER,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
  );
  
  INSERT INTO productos (id, tipo) VALUES (1, 'Jabon');
  INSERT INTO ventas_detalles (id, producto_id) VALUES (1, 1);
`);

console.log("Tablas creadas con datos mock.");

try {
  db.pragma('foreign_keys = OFF');
  db.exec(`
    BEGIN TRANSACTION;
    CREATE TABLE productos_nueva (
      id INTEGER PRIMARY KEY,
      nombre TEXT
    );
    INSERT INTO productos_nueva (id, nombre) SELECT id, tipo FROM productos;
    DROP TABLE productos;
    ALTER TABLE productos_nueva RENAME TO productos;
    COMMIT;
  `);
  db.pragma('foreign_keys = ON');
  
  const fk_check = db.pragma('foreign_key_check');
  console.log("FK check results (should be []):", fk_check);

  console.log("✅ Migración completada exitosamente.");
} catch (e) {
  console.error("❌ Error durante la migración:", e.message);
}

