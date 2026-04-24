import { query } from '../lib/db/db.js';

async function migrate() {
  console.log('Running WhatsApp DB migrations...');
  
  try {
    // Create whatsapp_sessions table
    await query(`
      CREATE TABLE IF NOT EXISTS whatsapp_sessions (
        phone_number TEXT PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        state TEXT DEFAULT 'REQUIRE_PIN',
        context JSONB DEFAULT '{}'::jsonb,
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        store_id INTEGER REFERENCES stores(id)
      );
    `);
    console.log('Table whatsapp_sessions created or already exists.');

    // Attempt to add image_url to order_items
    try {
      await query(`ALTER TABLE order_items ADD COLUMN image_url TEXT;`);
      console.log('Added image_url to order_items');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('Column image_url already exists in order_items');
      } else {
        throw e;
      }
    }

    console.log('Migrations complete.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
