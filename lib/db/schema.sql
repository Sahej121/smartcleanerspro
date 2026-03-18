-- CleanFlow Database Schema

CREATE TABLE IF NOT EXISTS stores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  store_name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'India',
  phone TEXT,
  owner_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  role TEXT CHECK(role IN ('owner','manager','frontdesk','staff','driver')) DEFAULT 'staff',
  store_id INTEGER REFERENCES stores(id),
  password_hash TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  loyalty_points INTEGER DEFAULT 0,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT UNIQUE NOT NULL,
  customer_id INTEGER REFERENCES customers(id),
  store_id INTEGER REFERENCES stores(id) DEFAULT 1,
  status TEXT CHECK(status IN ('received','processing','ready','delivered','cancelled')) DEFAULT 'received',
  total_amount REAL DEFAULT 0,
  discount REAL DEFAULT 0,
  tax REAL DEFAULT 0,
  payment_status TEXT CHECK(payment_status IN ('pending','paid','partial','refunded')) DEFAULT 'pending',
  payment_method TEXT CHECK(payment_method IN ('cash','card','upi','online')) DEFAULT 'cash',
  pickup_date TEXT,
  delivery_date TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  garment_type TEXT NOT NULL,
  service_type TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  price REAL NOT NULL,
  status TEXT CHECK(status IN ('received','sorting','washing','dry_cleaning','drying','ironing','quality_check','ready','delivered')) DEFAULT 'received',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS garment_workflow (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_item_id INTEGER REFERENCES order_items(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  updated_by INTEGER REFERENCES users(id),
  notes TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  payment_method TEXT CHECK(payment_method IN ('cash','card','upi','online')) DEFAULT 'cash',
  transaction_id TEXT,
  payment_status TEXT CHECK(payment_status IN ('pending','completed','failed','refunded')) DEFAULT 'completed',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pricing (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  garment_type TEXT NOT NULL,
  service_type TEXT NOT NULL,
  price REAL NOT NULL,
  store_id INTEGER REFERENCES stores(id) DEFAULT 1,
  UNIQUE(garment_type, service_type, store_id)
);

CREATE TABLE IF NOT EXISTS inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_name TEXT NOT NULL,
  quantity REAL DEFAULT 0,
  unit TEXT DEFAULT 'units',
  reorder_level REAL DEFAULT 10,
  store_id INTEGER REFERENCES stores(id) DEFAULT 1
);

CREATE TABLE IF NOT EXISTS machines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  machine_name TEXT NOT NULL,
  machine_type TEXT CHECK(machine_type IN ('washer','dryer','dry_clean_machine','steam_press')) NOT NULL,
  status TEXT CHECK(status IN ('idle','running','maintenance')) DEFAULT 'idle',
  store_id INTEGER REFERENCES stores(id) DEFAULT 1
);

CREATE TABLE IF NOT EXISTS machine_loads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  machine_id INTEGER REFERENCES machines(id),
  order_item_id INTEGER REFERENCES order_items(id),
  start_time DATETIME,
  end_time DATETIME,
  status TEXT CHECK(status IN ('loading','running','completed')) DEFAULT 'loading'
);
