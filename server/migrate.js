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
    // 1. Crear ENUM de roles
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
          CREATE TYPE user_role AS ENUM (
            'Docente',
            'Directivo',
            'Administrativo',
            'Prefeccion',
            'Trabajo Social',
            'Sistemas'
          );
        END IF;
      END
      $$;
    `);
    console.log('✅ ENUM user_role listo');

    // 2. Crear tabla usuarios
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id          CHAR(11)     PRIMARY KEY,
        nombre      VARCHAR(255) NOT NULL,
        rol         user_role    NOT NULL,
        correo      VARCHAR(255) NOT NULL UNIQUE,
        password    TEXT         NOT NULL,
        created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        deleted_at  TIMESTAMPTZ  DEFAULT NULL
      );
    `);
    console.log('✅ Tabla usuarios lista');

    // 3. Índice en correo
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_usuarios_correo ON usuarios(correo);
    `);
    console.log('✅ Índice en correo listo');

    // 4. Función para updated_at automático
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 5. Trigger
    await client.query(`
      DROP TRIGGER IF EXISTS trigger_usuarios_updated_at ON usuarios;
    `);
    await client.query(`
      CREATE TRIGGER trigger_usuarios_updated_at
        BEFORE UPDATE ON usuarios
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('✅ Trigger updated_at listo');

    console.log('\n🎉 Migración completada exitosamente');
  } catch (err) {
    console.error('❌ Error en migración:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(() => process.exit(1));
