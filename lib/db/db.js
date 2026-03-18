import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const DB_PATH = path.join(process.cwd(), 'cleanflow.db');

let db;

export function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeDb();
  }
  return db;
}

function initializeDb() {
  const schemaPath = path.join(process.cwd(), 'lib', 'db', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);

  // Check if we need to seed
  const storeCount = db.prepare('SELECT COUNT(*) as count FROM stores').get();
  if (storeCount.count === 0) {
    seedDatabase();
  }
}

function seedDatabase() {
  // Store
  db.prepare(`INSERT INTO stores (store_name, address, city, country, phone) VALUES (?, ?, ?, ?, ?)`)
    .run('CleanFlow Main', '123 MG Road', 'New Delhi', 'India', '+91-9876543210');

  // Hardcode a password hash for the owner (password: password123)
  const defaultPasswordHash = bcrypt.hashSync('password123', 10);

  // Users
  const users = [
    ['Sahej (Owner)', 'sahej@cleanflow.com', defaultPasswordHash, 'owner', 1],
    ['Priya Sharma', 'priya@cleanflow.com', defaultPasswordHash, 'manager', 1],
    ['Rahul Kumar', 'rahul@cleanflow.com', defaultPasswordHash, 'frontdesk', 1],
    ['Amit Patel', 'amit@cleanflow.com', defaultPasswordHash, 'staff', 1],
    ['Sunita Devi', 'sunita@cleanflow.com', defaultPasswordHash, 'staff', 1],
  ];
  
  // Note: the schema requires `password_hash`, not `phone` as in the original mock data
  const insertUser = db.prepare(`INSERT INTO users (name, email, password_hash, role, store_id) VALUES (?, ?, ?, ?, ?)`);
  users.forEach(u => insertUser.run(...u));

  // Customers
  const customers = [
    ['Arjun Mehta', '+91-9811001001', 'arjun@email.com', '45 Connaught Place, Delhi', 120, 'Prefers starch-free ironing'],
    ['Sneha Gupta', '+91-9811001002', 'sneha@email.com', '12 Hauz Khas, Delhi', 85, ''],
    ['Vikram Singh', '+91-9811001003', 'vikram@email.com', '78 Lajpat Nagar, Delhi', 200, 'Silk garments - handle with care'],
    ['Neha Kapoor', '+91-9811001004', 'neha@email.com', '33 Safdarjung, Delhi', 45, ''],
    ['Rajesh Khanna', '+91-9811001005', 'rajesh@email.com', '90 Dwarka Sec-7, Delhi', 150, 'Regular weekly customer'],
    ['Ananya Iyer', '+91-9811001006', 'ananya@email.com', '22 Vasant Kunj, Delhi', 60, ''],
    ['Mohit Verma', '+91-9811001007', 'mohit@email.com', '56 Rohini Sec-3, Delhi', 30, ''],
    ['Kavita Joshi', '+91-9811001008', 'kavita@email.com', '14 Greater Kailash, Delhi', 90, 'Allergic to certain detergents'],
  ];
  const insertCustomer = db.prepare(`INSERT INTO customers (name, phone, email, address, loyalty_points, notes) VALUES (?, ?, ?, ?, ?, ?)`);
  customers.forEach(c => insertCustomer.run(...c));

  // Pricing
  const pricing = [
    ['Shirt', 'Dry Cleaning', 80], ['Shirt', 'Washing', 40], ['Shirt', 'Ironing', 25], ['Shirt', 'Stain Removal', 100],
    ['Suit', 'Dry Cleaning', 250], ['Suit', 'Washing', 150], ['Suit', 'Ironing', 80], ['Suit', 'Stain Removal', 200],
    ['Dress', 'Dry Cleaning', 200], ['Dress', 'Washing', 120], ['Dress', 'Ironing', 60], ['Dress', 'Stain Removal', 180],
    ['Coat', 'Dry Cleaning', 300], ['Coat', 'Washing', 200], ['Coat', 'Ironing', 100],
    ['Trousers', 'Dry Cleaning', 120], ['Trousers', 'Washing', 60], ['Trousers', 'Ironing', 35], ['Trousers', 'Stain Removal', 120],
    ['Curtains', 'Dry Cleaning', 350], ['Curtains', 'Washing', 250], ['Curtains', 'Ironing', 150],
    ['Blanket', 'Dry Cleaning', 400], ['Blanket', 'Washing', 300],
    ['Saree', 'Dry Cleaning', 200], ['Saree', 'Washing', 100], ['Saree', 'Ironing', 80], ['Saree', 'Stain Removal', 150],
    ['Jacket', 'Dry Cleaning', 220], ['Jacket', 'Washing', 140], ['Jacket', 'Ironing', 70],
    ['Shirt', 'Express Service', 150], ['Suit', 'Express Service', 450], ['Dress', 'Express Service', 380],
  ];
  const insertPricing = db.prepare(`INSERT INTO pricing (garment_type, service_type, price) VALUES (?, ?, ?)`);
  pricing.forEach(p => insertPricing.run(...p));

  // Sample orders with workflow
  const now = new Date();
  const orderData = [
    { customer: 1, number: 'CF-1001', status: 'processing', total: 330, payment: 'paid', method: 'upi', daysAgo: 2, items: [
      { garment: 'Suit', service: 'Dry Cleaning', price: 250, status: 'dry_cleaning' },
      { garment: 'Shirt', service: 'Ironing', price: 25, status: 'ironing' },
      { garment: 'Shirt', service: 'Washing', price: 40, status: 'washing' },
    ]},
    { customer: 2, number: 'CF-1002', status: 'ready', total: 200, payment: 'paid', method: 'card', daysAgo: 3, items: [
      { garment: 'Dress', service: 'Dry Cleaning', price: 200, status: 'ready' },
    ]},
    { customer: 3, number: 'CF-1003', status: 'received', total: 620, payment: 'pending', method: 'cash', daysAgo: 0, items: [
      { garment: 'Curtains', service: 'Dry Cleaning', price: 350, status: 'received' },
      { garment: 'Saree', service: 'Stain Removal', price: 150, status: 'received' },
      { garment: 'Trousers', service: 'Ironing', price: 35, status: 'sorting' },
    ]},
    { customer: 5, number: 'CF-1004', status: 'processing', total: 450, payment: 'paid', method: 'upi', daysAgo: 1, items: [
      { garment: 'Blanket', service: 'Washing', price: 300, status: 'drying' },
      { garment: 'Shirt', service: 'Stain Removal', price: 100, status: 'quality_check' },
    ]},
    { customer: 4, number: 'CF-1005', status: 'delivered', total: 160, payment: 'paid', method: 'cash', daysAgo: 5, items: [
      { garment: 'Shirt', service: 'Dry Cleaning', price: 80, status: 'delivered' },
      { garment: 'Trousers', service: 'Dry Cleaning', price: 120, status: 'delivered' },
    ]},
    { customer: 6, number: 'CF-1006', status: 'processing', total: 280, payment: 'paid', method: 'card', daysAgo: 1, items: [
      { garment: 'Saree', service: 'Dry Cleaning', price: 200, status: 'ironing' },
      { garment: 'Shirt', service: 'Ironing', price: 25, status: 'quality_check' },
    ]},
  ];

  const insertOrder = db.prepare(`INSERT INTO orders (order_number, customer_id, store_id, status, total_amount, payment_status, payment_method, created_at) VALUES (?, ?, 1, ?, ?, ?, ?, ?)`);
  const insertItem = db.prepare(`INSERT INTO order_items (order_id, garment_type, service_type, quantity, price, status) VALUES (?, ?, ?, 1, ?, ?)`);
  const insertWorkflow = db.prepare(`INSERT INTO garment_workflow (order_item_id, stage, updated_by, timestamp) VALUES (?, ?, 3, ?)`);
  const insertPayment = db.prepare(`INSERT INTO payments (order_id, amount, payment_method, payment_status) VALUES (?, ?, ?, ?)`);

  orderData.forEach(o => {
    const date = new Date(now);
    date.setDate(date.getDate() - o.daysAgo);
    const dateStr = date.toISOString();

    const result = insertOrder.run(o.number, o.customer, o.status, o.total, o.payment, o.method, dateStr);
    const orderId = result.lastInsertRowid;

    if (o.payment === 'paid') {
      insertPayment.run(orderId, o.total, o.method, 'completed');
    }

    o.items.forEach(item => {
      const itemResult = insertItem.run(orderId, item.garment, item.service, item.price, item.status);
      insertWorkflow.run(itemResult.lastInsertRowid, item.status, dateStr);
    });
  });

  // Inventory
  const inventory = [
    ['Detergent (Liquid)', 25, 'liters', 5],
    ['Dry Cleaning Solvent', 15, 'liters', 5],
    ['Fabric Softener', 10, 'liters', 3],
    ['Stain Remover', 8, 'bottles', 2],
    ['Hangers (Plastic)', 200, 'units', 50],
    ['Garment Bags', 150, 'units', 30],
    ['Tags/Labels', 500, 'units', 100],
    ['Packaging Wrap', 20, 'rolls', 5],
  ];
  const insertInventory = db.prepare(`INSERT INTO inventory (item_name, quantity, unit, reorder_level) VALUES (?, ?, ?, ?)`);
  inventory.forEach(i => insertInventory.run(...i));

  // Machines
  const machines = [
    ['Washer A1', 'washer', 'running'],
    ['Washer A2', 'washer', 'idle'],
    ['Dryer B1', 'dryer', 'running'],
    ['Dryer B2', 'dryer', 'idle'],
    ['Dry Clean Pro', 'dry_clean_machine', 'idle'],
    ['Steam Press 1', 'steam_press', 'running'],
    ['Steam Press 2', 'steam_press', 'maintenance'],
  ];
  const insertMachine = db.prepare(`INSERT INTO machines (machine_name, machine_type, status) VALUES (?, ?, ?)`);
  machines.forEach(m => insertMachine.run(...m));
}
