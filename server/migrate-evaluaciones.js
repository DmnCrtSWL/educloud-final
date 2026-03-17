require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

pool.query(`
  -- ── Tabla principal de evaluaciones ──────────────────────────────────────
  CREATE TABLE IF NOT EXISTS evaluaciones (
    id               TEXT        PRIMARY KEY,
    grupo_id         TEXT        NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
    nombre           TEXT        NOT NULL,
    descripcion      TEXT,
    tipo             TEXT        NOT NULL CHECK (tipo IN ('Tarea','Trabajo en Clase','Examen')),
    ponderacion_mes  INT         CHECK (ponderacion_mes BETWEEN 1 AND 100),
    fecha_inicio     DATE        NOT NULL,
    fecha_entrega    DATE        NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at       TIMESTAMPTZ DEFAULT NULL
  );

  -- ── Criterios de rúbrica ─────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS evaluacion_criterios (
    id               SERIAL      PRIMARY KEY,
    evaluacion_id    TEXT        NOT NULL REFERENCES evaluaciones(id) ON DELETE CASCADE,
    nombre           TEXT        NOT NULL,
    porcentaje       INT         NOT NULL CHECK (porcentaje BETWEEN 1 AND 100),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  -- ── Índices ──────────────────────────────────────────────────────────────
  CREATE INDEX IF NOT EXISTS idx_evaluaciones_grupo_id ON evaluaciones(grupo_id);

  -- ── Función updated_at (reutilizable) ────────────────────────────────────
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  -- ── Triggers ─────────────────────────────────────────────────────────────
  DROP TRIGGER IF EXISTS trg_evaluaciones_updated_at ON evaluaciones;
  CREATE TRIGGER trg_evaluaciones_updated_at
    BEFORE UPDATE ON evaluaciones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  DROP TRIGGER IF EXISTS trg_evaluacion_criterios_updated_at ON evaluacion_criterios;
  CREATE TRIGGER trg_evaluacion_criterios_updated_at
    BEFORE UPDATE ON evaluacion_criterios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`).then(() => {
  console.log('✅ Tablas evaluaciones y evaluacion_criterios creadas correctamente');
  pool.end();
}).catch(e => {
  console.error('❌ Error:', e.message);
  pool.end();
  process.exit(1);
});
