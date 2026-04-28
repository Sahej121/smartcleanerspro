const pg = require('pg');
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/cleanflow',
});

async function checkSessions() {
  try {
    const res = await pool.query("SELECT * FROM whatsapp_sessions;");
    console.log('WA Sessions:');
    console.table(res.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkSessions();
