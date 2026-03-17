const pool = require('./db');
async function fix() {
  const { rows } = await pool.query('SELECT alumno_id FROM grupo_alumnos GROUP BY alumno_id HAVING count(*) > 1');
  for (const row of rows) {
    const instances = await pool.query('SELECT * FROM grupo_alumnos WHERE alumno_id = $1 ORDER BY enrolled_at DESC', [row.alumno_id]);
    const toDelete = instances.rows.slice(1).map(r => r.grupo_id);
    console.log(`Alumno ${row.alumno_id} in multiple groups. Keeping ${instances.rows[0].grupo_id}, deleting from: ${toDelete.join(', ')}`);
    await pool.query('DELETE FROM grupo_alumnos WHERE alumno_id = $1 AND grupo_id = ANY($2)', [row.alumno_id, toDelete]);
  }
  try {
    await pool.query('ALTER TABLE grupo_alumnos ADD CONSTRAINT unique_alumno_grupo UNIQUE (alumno_id)');
    console.log('Constraint added.');
  } catch (e) {
    console.log('Constraint error (might already exist):', e.message);
  }
  console.log('Done.');
  pool.end();
}
fix();
