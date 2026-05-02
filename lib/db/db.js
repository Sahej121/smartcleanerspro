import pg from 'pg';

const { Pool } = pg;

let pool;

function sanitizeDatabaseUrl(raw) {
  if (!raw) return '';
  let v = String(raw).trim();
  // Vercel UI sometimes stores values with surrounding quotes.
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim();
  }
  return v;
}

function getPool() {
  if (!pool) {
    const databaseUrl = sanitizeDatabaseUrl(process.env.DATABASE_URL);

    if (!databaseUrl) {
      throw new Error(
        'DATABASE_URL is not set. Configure your Supabase Postgres connection string in .env.local.'
      );
    }

    let dbHost = '';
    try {
      dbHost = new URL(databaseUrl).hostname;
    } catch {
      throw new Error(
        'DATABASE_URL is not a valid URL. In Vercel, set DATABASE_URL to a full Postgres connection string like ' +
          '"postgresql://postgres:<PASSWORD>@db.<project-ref>.supabase.co:5432/postgres" ' +
          '(or the Supabase Session Pooler URL if required).'
      );
    }

    if (
      dbHost === 'base' ||
      dbHost === 'localhost' ||
      dbHost === '127.0.0.1' ||
      !dbHost.includes('.')
    ) {
      throw new Error(
        `DATABASE_URL hostname looks wrong: "${dbHost}". Set it to your Supabase Postgres connection string (db.<project-ref>.supabase.co) ` +
          'or the Supabase Session Pooler hostname.'
      );
    }

    const dbPort = new URL(databaseUrl).port || '5432';
    if (dbPort === '5432' && !databaseUrl.includes('localhost')) {
      console.warn('⚠️ [DB] Warning: Using direct Postgres port (5432). For production-grade scaling, switch to Supavisor port (6543) and append ?pgbouncer=true to your DATABASE_URL.');
    }

    pool = new Pool({
      connectionString: databaseUrl,
      // Tuning for performance
      max: 20, // Increased max connections
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      // Supabase pooler requires SSL
      ssl: databaseUrl.includes('supabase')
        ? { rejectUnauthorized: false }
        : undefined,
      // Prevent hanging queries
      statement_timeout: 10000, 
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
