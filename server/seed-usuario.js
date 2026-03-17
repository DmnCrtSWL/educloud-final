require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function generateId() {
  let id, exists = true;
  while (exists) {
    const p = () => String(Math.floor(Math.random() * 900) + 100);
    id = `${p()}-${p()}-${p()}`;
    const r = await pool.query('SELECT 1 FROM usuarios WHERE id = $1', [id]);
    exists = r.rowCount > 0;
  }
  return id;
}

(async () => {
  const id = await generateId();
  const hash = await bcrypt.hash('PamMartin1!', 12);
  const r = await pool.query(
    `INSERT INTO usuarios (id, nombre, rol, correo, password)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, nombre, rol, correo`,
    [id, 'Ricardo Corona', 'Sistemas', 'demiancrate@gmail.com', hash]
  );
  console.log('✅ Usuario creado:', r.rows[0]);
  pool.end();
})().catch(e => { console.error('❌', e.message); pool.end(); process.exit(1); });
