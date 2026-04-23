import pg from 'pg';

const { Pool } = pg;

let pool;

function getPool() {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL?.trim();

    if (!databaseUrl) {
      throw new Error(
        'DATABASE_URL is not set. Configure your Supabase Postgres connection string in .env.local.'
      );
    }

    let dbHost = '';
    try {
      dbHost = new URL(databaseUrl).hostname;
    } catch {
      // Keep the native pg error path for malformed URLs.
    }

    if (dbHost === 'localhost' || dbHost === '127.0.0.1') {
      throw new Error(
        'DATABASE_URL points to localhost. Set it to your Supabase Postgres connection string.'
      );
    }

    pool = new Pool({
      connectionString: databaseUrl,
      // Supabase pooler requires SSL
      ssl: databaseUrl.includes('supabase')
        ? { rejectUnauthorized: false }
        : undefined,
    });
  }
  return pool;
}

export async function query(text, params) {
  const p = getPool();
  return p.query(text, params);
}

// Log a system event (Global/Multi-tenant)
export async function logSystemEvent(eventType, description, severity = 'info', storeId = null) {
  try {
    const p = getPool();
    await p.query(
      'INSERT INTO system_logs (event_type, description, severity, store_id) VALUES ($1, $2, $3, $4)',
      [eventType, description, severity, storeId]
    );
  } catch (err) {
    console.error('[DB] Failed to log system event:', err);
  }
}

export async function getClient() {
  const p = getPool();
  return p.connect();
}

export async function transaction(callback) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(async (text, params) => client.query(text, params));
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
