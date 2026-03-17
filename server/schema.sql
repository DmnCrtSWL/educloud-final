-- EduCloud - Tabla de Usuarios
-- Ejecutar una sola vez en la base de datos Neon

-- Tipo ENUM para roles de usuario
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM (
      'Docente',
      'Directivo',
      'Administrativo',
      'Prefectura',
      'Trabajo Social',
      'Sistemas'
    );
  END IF;
END
$$;

-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id          CHAR(11)     PRIMARY KEY,               -- Formato: XXX-XXX-XXX generado por el servidor
  nombre      VARCHAR(255) NOT NULL,
  rol         user_role    NOT NULL,
  correo      VARCHAR(255) NOT NULL UNIQUE,
  password    TEXT         NOT NULL,                   -- Hash bcrypt
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ  DEFAULT NULL               -- Soft delete
);

-- Índice en correo para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_usuarios_correo ON usuarios(correo);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at en cada UPDATE
DROP TRIGGER IF EXISTS trigger_usuarios_updated_at ON usuarios;
CREATE TRIGGER trigger_usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
