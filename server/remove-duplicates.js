const pool = require('./db');

async function checkDuplicates() {
  try {
    const { rows } = await pool.query(`
      SELECT curp, COUNT(*) as count
      FROM alumnos
      WHERE deleted_at IS NULL
      GROUP BY curp
      HAVING COUNT(*) > 1
    `);

    if (rows.length === 0) {
      console.log('No duplicates found.');
    } else {
      console.log('Duplicated CURPs:');
      console.log(rows);

      for (const row of rows) {
        const { rows: instances } = await pool.query(
          `SELECT a.id, a.nombre, a.curp, ga.grupo_id 
           FROM alumnos a 
           LEFT JOIN grupo_alumnos ga ON ga.alumno_id = a.id 
           WHERE a.curp = $1 AND a.deleted_at IS NULL
           ORDER BY ga.grupo_id NULLS LAST, a.created_at ASC`,
          [row.curp]
        );
        console.log(`Instances for ${row.curp}:`);
        console.table(instances);

        // We will keep the first instance (which is enrolled, or oldest) and soft-delete the rest
        if (instances.length > 1) {
          const toDelete = instances.slice(1);
          const toDeleteIds = toDelete.map(i => i.id);
          console.log(`Will softly delete IDs: ${toDeleteIds.join(', ')}`);
          
          await pool.query(`
            UPDATE alumnos 
            SET deleted_at = NOW() 
            WHERE id = ANY($1)
          `, [toDeleteIds]);
        }
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

checkDuplicates();
