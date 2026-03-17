require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

pool.query(`
  CREATE TABLE IF NOT EXISTS grupos (
    id             TEXT PRIMARY KEY,
    grado          INT NOT NULL CHECK (grado IN (1,2,3)),
    grupo          TEXT NOT NULL,
    materia        TEXT NOT NULL,
    turno          TEXT NOT NULL CHECK (turno IN ('Matutino','Vespertino')),
    docente_id     TEXT NOT NULL,
    docente_nombre TEXT NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE UNIQUE INDEX IF NOT EXISTS grupos_grado_grupo_materia_turno_uidx
    ON grupos (grado, grupo, materia, turno);
`).then(() => {
  console.log('✅ Tabla grupos creada correctamente');
  pool.end();
}).catch(e => {
  console.error('❌ Error:', e.message);
  pool.end();
  process.exit(1);
});
