require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

async function runMigration() {
  const client = await pool.connect();
  console.log('Conectado a Neon PostgreSQL...');

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS alumnos (
        id          VARCHAR(11)  PRIMARY KEY,     -- Formato: EDU-XXX-XXX generado por el servidor
        nombre      VARCHAR(255) NOT NULL,
        curp        CHAR(18)     NOT NULL UNIQUE,
        created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        deleted_at  TIMESTAMPTZ  DEFAULT NULL
      );
    `);
    console.log('✅ Tabla alumnos lista');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_alumnos_curp ON alumnos(curp);
    `);
    console.log('✅ Índice en curp listo');

    await client.query(`
      CREATE OR REPLACE FUNCTION update_alumnos_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS trigger_alumnos_updated_at ON alumnos;
    `);
    await client.query(`
      CREATE TRIGGER trigger_alumnos_updated_at
        BEFORE UPDATE ON alumnos
        FOR EACH ROW
        EXECUTE FUNCTION update_alumnos_updated_at();
    `);
    console.log('✅ Trigger updated_at listo');

    console.log('\n🎉 Migración alumnos completada exitosamente');
  } catch (err) {
    console.error('❌ Error:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(() => process.exit(1));
