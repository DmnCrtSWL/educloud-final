require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

pool.query(`
  CREATE TABLE IF NOT EXISTS grupo_alumnos (
    grupo_id   TEXT NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
    alumno_id  TEXT NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (grupo_id, alumno_id)
  );
`).then(() => {
  console.log('✅ Tabla grupo_alumnos creada');
  pool.end();
}).catch(e => {
  console.error('❌ Error:', e.message);
  pool.end();
  process.exit(1);
});
