require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Quitar columnas de materia/docente de la tabla grupos
    //    (solo si existen — idempotente)
    await client.query(`
      ALTER TABLE grupos
        DROP COLUMN IF EXISTS materia,
        DROP COLUMN IF EXISTS docente_id,
        DROP COLUMN IF EXISTS docente_nombre;
    `);
    console.log('✅ Columnas materia/docente eliminadas de grupos');

    // 2. Eliminar índice único antiguo y crear el nuevo
    await client.query(`
      DROP INDEX IF EXISTS grupos_grado_grupo_materia_turno_uidx;
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS grupos_grado_grupo_turno_uidx
        ON grupos (grado, grupo, turno);
    `);
    console.log('✅ Índice único actualizado (grado, grupo, turno)');

    // 3. Crear tabla grupo_materias
    await client.query(`
      CREATE TABLE IF NOT EXISTS grupo_materias (
        id             TEXT PRIMARY KEY,
        grupo_id       TEXT NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
        nombre         TEXT NOT NULL,
        horario        TEXT,
        docente_id     TEXT NOT NULL,
        docente_nombre TEXT NOT NULL,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    console.log('✅ Tabla grupo_materias creada');

    await client.query('COMMIT');
    console.log('🎉 Migración completada exitosamente');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Error en migración:', e.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
