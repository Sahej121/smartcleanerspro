-- P0 Migration: Add missing columns and tables
-- Safe to run repeatedly (idempotent)

-- 1. orders: logistics columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_status TEXT DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS logistics_notes TEXT;

-- 2. order_items: garment tracking columns
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS tag_id TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS bag_id TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS incident_status TEXT DEFAULT 'none';
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS incident_notes TEXT;

-- 3. customers: store_id for multi-tenancy
ALTER TABLE customers ADD COLUMN IF NOT EXISTS store_id INTEGER REFERENCES stores(id) DEFAULT 1;

-- 4. volume_discounts table
CREATE TABLE IF NOT EXISTS volume_discounts (
  id SERIAL PRIMARY KEY,
  min_quantity INTEGER NOT NULL,
  discount_percent NUMERIC(5,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  store_id INTEGER REFERENCES stores(id) DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Add unique constraint on tag_id if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'order_items_tag_id_key'
  ) THEN
    ALTER TABLE order_items ADD CONSTRAINT order_items_tag_id_key UNIQUE (tag_id);
  END IF;
END $$;
