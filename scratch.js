const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cxqjqvopfaumykvuowuf:x6%26C5xuUbRSd%2B_3@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});
client.connect().then(() => { console.log('Connected'); client.end(); }).catch(e => console.error('Error', e.message));
