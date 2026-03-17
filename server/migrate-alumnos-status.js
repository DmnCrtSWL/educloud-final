const pool = require('./db');

async function migrate() {
  try {
    console.log('Adding estatus column to alumnos table...');
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='alumnos' AND column_name='estatus') THEN
          ALTER TABLE alumnos ADD COLUMN estatus VARCHAR(20) DEFAULT 'Activo';
        END IF;
      END
      $$;
    `);
    
    // Convert existing soft-deleted alumnos (if any were meant to be just "Baja")
    // but better let's just make sure all current ones are 'Activo' if not deleted.
    await pool.query("UPDATE alumnos SET estatus = 'Activo' WHERE estatus IS NULL");
    
    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
