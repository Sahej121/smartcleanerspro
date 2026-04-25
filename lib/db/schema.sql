-- CleanFlow Database Schema (PostgreSQL / Supabase)

CREATE TABLE IF NOT EXISTS stores (
  id SERIAL PRIMARY KEY,
  store_name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'India',
  phone TEXT,
  owner_id INTEGER,
  status TEXT CHECK(status IN ('active', 'suspended', 'idle')) DEFAULT 'active',
  subscription_tier VARCHAR(20) DEFAULT 'software_only',
  subscription_status TEXT DEFAULT 'trial',
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coupons (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT CHECK(discount_type IN ('percent', 'fixed')) DEFAULT 'percent',
  discount_value NUMERIC(10,2) NOT NULL,
  min_order_value NUMERIC(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  expiry_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  store_id INTEGER REFERENCES stores(id) DEFAULT 1
);

CREATE TABLE IF NOT EXISTS system_logs (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT DEFAULT 'info',
  store_id INTEGER REFERENCES stores(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  auth_id UUID UNIQUE,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  role TEXT CHECK(role IN ('superadmin','owner','manager','frontdesk','staff','driver')) DEFAULT 'staff',
  store_id INTEGER REFERENCES stores(id),
  password_hash TEXT,
  pin_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE,
  email TEXT,
  address TEXT,
  loyalty_points INTEGER DEFAULT 0,
  notes TEXT,
  store_id INTEGER REFERENCES stores(id) DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  customer_id INTEGER REFERENCES customers(id),
  store_id INTEGER REFERENCES stores(id) DEFAULT 1,
  status TEXT CHECK(status IN ('received','processing','ready','delivered','cancelled')) DEFAULT 'received',
  total_amount NUMERIC(10,2) DEFAULT 0,
  discount NUMERIC(10,2) DEFAULT 0,
  tax NUMERIC(10,2) DEFAULT 0,
  payment_status TEXT CHECK(payment_status IN ('pending','paid','partial','refunded')) DEFAULT 'pending',
  payment_method TEXT CHECK(payment_method IN ('cash','card','upi','online')) DEFAULT 'cash',
  pickup_date TEXT,
  delivery_date TEXT,
  pickup_status TEXT CHECK(pickup_status IN ('pending','scheduled','in_transit','completed')) DEFAULT 'pending',
  delivery_status TEXT CHECK(delivery_status IN ('pending','scheduled','in_transit','completed')) DEFAULT 'pending',
  logistics_notes TEXT,
  bag_id TEXT,
  notes TEXT,
  coupon_id INTEGER REFERENCES coupons(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  garment_type TEXT NOT NULL,
  service_type TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  price NUMERIC(10,2) NOT NULL,
  status TEXT CHECK(status IN ('received','sorting','washing','dry_cleaning','drying','ironing','quality_check','ready','delivered')) DEFAULT 'received',
  tag_id TEXT UNIQUE,
  bag_id TEXT,
  incident_status TEXT CHECK(incident_status IN ('none','reported','investigating','resolved')) DEFAULT 'none',
  incident_notes TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS garment_workflow (
  id SERIAL PRIMARY KEY,
  order_item_id INTEGER REFERENCES order_items(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  updated_by INTEGER REFERENCES users(id),
  notes TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT CHECK(payment_method IN ('cash','card','upi','online')) DEFAULT 'cash',
  transaction_id TEXT,
  payment_status TEXT CHECK(payment_status IN ('pending','completed','failed','refunded')) DEFAULT 'completed',
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pricing (
  id SERIAL PRIMARY KEY,
  garment_type TEXT NOT NULL,
  service_type TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  store_id INTEGER REFERENCES stores(id) DEFAULT 1,
  UNIQUE(garment_type, service_type, store_id)
);

CREATE TABLE IF NOT EXISTS inventory (
  id SERIAL PRIMARY KEY,
  item_name TEXT NOT NULL,
  quantity NUMERIC(10,2) DEFAULT 0,
  unit TEXT DEFAULT 'units',
  reorder_level NUMERIC(10,2) DEFAULT 10,
  store_id INTEGER REFERENCES stores(id) DEFAULT 1,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  historical_daily_burn NUMERIC(10,4) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS machines (
  id SERIAL PRIMARY KEY,
  machine_name TEXT NOT NULL,
  machine_type TEXT CHECK(machine_type IN ('washer','dryer','dry_clean_machine','steam_press')) NOT NULL,
  status TEXT CHECK(status IN ('idle','running','maintenance')) DEFAULT 'idle',
  store_id INTEGER REFERENCES stores(id) DEFAULT 1
);

CREATE TABLE IF NOT EXISTS machine_loads (
  id SERIAL PRIMARY KEY,
  machine_id INTEGER REFERENCES machines(id),
  order_item_id INTEGER REFERENCES order_items(id),
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  status TEXT CHECK(status IN ('loading','running','completed')) DEFAULT 'loading'
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id SERIAL PRIMARY KEY,
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK(status IN ('open','in_progress','resolved','closed')) DEFAULT 'open',
  priority TEXT CHECK(priority IN ('low','medium','high')) DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_tasks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  store_id INTEGER REFERENCES stores(id) DEFAULT 1,
  task_description TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS volume_discounts (
  id SERIAL PRIMARY KEY,
  min_quantity INTEGER NOT NULL,
  discount_percent NUMERIC(5,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  store_id INTEGER REFERENCES stores(id) DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrations (applied conditionally via IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)

CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  phone_number TEXT PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  state TEXT DEFAULT 'REQUIRE_PIN',
  context JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  store_id INTEGER REFERENCES stores(id)
);

DO $$ BEGIN
  ALTER TABLE order_items ADD COLUMN IF NOT EXISTS image_url TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS driver_id INTEGER REFERENCES users(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS signature_data TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS proof_photo_url TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS logistics_last_updated TIMESTAMPTZ DEFAULT NOW();
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 2000;
