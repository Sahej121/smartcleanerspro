import pg from 'pg';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

let pool;
let initialized = false;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }
  return pool;
}

export async function query(text, params) {
  const p = getPool();
  if (!initialized) {
    await initializeDb();
    initialized = true;
  }
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
  if (!initialized) {
    await initializeDb();
    initialized = true;
  }
  return p.connect();
}

async function initializeDb() {
  const p = getPool();
  const schemaPath = path.join(process.cwd(), 'lib', 'db', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  await p.query(schema);

  // Check if we need to seed
  const res = await p.query('SELECT COUNT(*) as count FROM stores');
  if (parseInt(res.rows[0].count) === 0) {
    await seedDatabase(p);
  }
}

async function seedDatabase(p) {
  console.log('[DB] Seeding database...');

  // Store
  await p.query(
    `INSERT INTO stores (store_name, address, city, country, phone) VALUES ($1, $2, $3, $4, $5)`,
    ['CleanFlow Main', '123 MG Road', 'New Delhi', 'India', '+91-9876543210']
  );

  // Owner password
  const ownerPasswordHash = bcrypt.hashSync('Truewords10@', 10);
  // Default staff password
  const staffPasswordHash = bcrypt.hashSync('staff1234', 10);

  // Users — owner, manager, frontdesk, and workers
  const users = [
    ['Sahej (Owner)', 'sahej@cleanflow.com', ownerPasswordHash, 'owner', 1],
    ['Priya Sharma', 'priya@cleanflow.com', staffPasswordHash, 'manager', 1],
    ['Rahul Kumar', 'rahul@cleanflow.com', staffPasswordHash, 'frontdesk', 1],
    ['Amit Patel', 'amit@cleanflow.com', staffPasswordHash, 'staff', 1],
    ['Sunita Devi', 'sunita@cleanflow.com', staffPasswordHash, 'staff', 1],
    ['Sarah Connor', 'sarah@cleanflow.com', staffPasswordHash, 'staff', 1],
    ['David Chen', 'david@cleanflow.com', staffPasswordHash, 'staff', 1],
    ['Elena Rodriguez', 'elena@cleanflow.com', staffPasswordHash, 'staff', 1],
    ['Ravi Shankar', 'ravi@cleanflow.com', staffPasswordHash, 'driver', 1],
    ['Meena Kumari', 'meena@cleanflow.com', staffPasswordHash, 'staff', 1],
  ];
  for (const u of users) {
    await p.query(
      `INSERT INTO users (name, email, password_hash, role, store_id) VALUES ($1, $2, $3, $4, $5)`,
      u
    );
  }

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
  for (const c of customers) {
    await p.query(
      `INSERT INTO customers (name, phone, email, address, loyalty_points, notes) VALUES ($1, $2, $3, $4, $5, $6)`,
      c
    );
  }

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
  for (const pr of pricing) {
    await p.query(
      `INSERT INTO pricing (garment_type, service_type, price) VALUES ($1, $2, $3)`,
      pr
    );
  }

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

  for (const o of orderData) {
    const date = new Date(now);
    date.setDate(date.getDate() - o.daysAgo);
    const dateStr = date.toISOString();

    const orderRes = await p.query(
      `INSERT INTO orders (order_number, customer_id, store_id, status, total_amount, payment_status, payment_method, created_at) 
       VALUES ($1, $2, 1, $3, $4, $5, $6, $7) RETURNING id`,
      [o.number, o.customer, o.status, o.total, o.payment, o.method, dateStr]
    );
    const orderId = orderRes.rows[0].id;

    if (o.payment === 'paid') {
      await p.query(
        `INSERT INTO payments (order_id, amount, payment_method, payment_status) VALUES ($1, $2, $3, 'completed')`,
        [orderId, o.total, o.method]
      );
    }

    for (const item of o.items) {
      const itemRes = await p.query(
        `INSERT INTO order_items (order_id, garment_type, service_type, quantity, price, status) 
         VALUES ($1, $2, $3, 1, $4, $5) RETURNING id`,
        [orderId, item.garment, item.service, item.price, item.status]
      );
      await p.query(
        `INSERT INTO garment_workflow (order_item_id, stage, updated_by, timestamp) VALUES ($1, $2, 3, $3)`,
        [itemRes.rows[0].id, item.status, dateStr]
      );
    }
  }

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
  for (const inv of inventory) {
    await p.query(
      `INSERT INTO inventory (item_name, quantity, unit, reorder_level) VALUES ($1, $2, $3, $4)`,
      inv
    );
  }

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
  for (const m of machines) {
    await p.query(
      `INSERT INTO machines (machine_name, machine_type, status) VALUES ($1, $2, $3)`,
      m
    );
  }

  // Support tickets seed
  const tickets = [
    ['Printer not cutting receipt automatically', 'The thermal printer at counter 2 is not auto-cutting receipts after printing.', 'in_progress', 'high'],
    ['Refund didn\'t go through on terminal', 'Customer refund for order CF-892 failed on card terminal.', 'resolved', 'medium'],
    ['How to add a new tax bracket for bags?', 'Need to configure 12% GST for bag cleaning services.', 'resolved', 'low'],
  ];
  for (const t of tickets) {
    await p.query(
      `INSERT INTO support_tickets (subject, description, status, priority) VALUES ($1, $2, $3, $4)`,
      t
    );
  }

  // Staff Tasks Seed
  const staffTasks = [
    ['Restock detergent pods', 4, false], // 4 is Amit Patel
    ['Clear lint traps (Dryers 1-4)', 4, false],
    ['Audit inventory: Hangers', 5, false], // 5 is Sunita Devi
    ['Calibrate Washer 02 sensor', 5, true],
    ['Organize delivery schedule', 8, false], // 8 is Ravi Shankar
  ];
  for (const st of staffTasks) {
    await p.query(
      `INSERT INTO staff_tasks (task_description, user_id, is_completed) VALUES ($1, $2, $3)`,
      st
    );
  }

  // System Logs Seed
  const systemLogs = [
    ['PROVISIONING', 'Store \'London Cleaners\' successfully deployed to Mumbai-Node-1', 'info', 1],
    ['BACKUP', 'Automated global database synchronization completed successfully', 'info', null],
    ['SECURITY', 'SSL Certificate for *.cleanflow.io renewed (v4.2 stable)', 'info', null],
    ['SYSTEM', 'Memory usage spike detected on Node-7; auto-scaling triggered', 'warning', null],
    ['PROVISIONING', 'New instance provisioned for \'Vogue Atelier\'', 'info', 2],
  ];
  for (const log of systemLogs) {
    await p.query(
      `INSERT INTO system_logs (event_type, description, severity, store_id) VALUES ($1, $2, $3, $4)`,
      log
    );
  }

  console.log('[DB] Seeding complete!');
}
