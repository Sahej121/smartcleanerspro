import { query } from '../lib/db/db.js';

async function verify() {
  try {
    // This will trigger initializeDb through the query function
    const res = await query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public';");
    console.log('Tables in DB:');
    console.table(res.rows);
    
    const sessions = await query("SELECT * FROM whatsapp_sessions;");
    console.log('Sessions:');
    console.table(sessions.rows);
  } catch (err) {
    console.error('Verify error:', err.message);
  } finally {
    process.exit();
  }
}

verify();
