const pool = require('./db.js');
async function run() {
  try {
    const r = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
    console.log(r.rows);
  } finally {
    process.exit(0);
  }
}
run();
