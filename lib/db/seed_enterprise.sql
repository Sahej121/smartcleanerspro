-- 1. Enterprise Store (Premium Client)

INSERT INTO stores (
store_name, address, city, country, phone, owner_id,
status, subscription_tier, subscription_status
)
VALUES (
'UrbanClean Elite Laundry',
'Plot 45, Sector 18',
'Gurugram',
'India',
'+91-9818000000',
NULL,
'active',
'premium',
'active'
)
ON CONFLICT DO NOTHING;

-- Capture store id
-- NOTE: We avoid psql variables here for portability. We inline the store_id
-- lookup via a subquery everywhere below.
--

-- 2. Users (Enterprise-level staff structure)

INSERT INTO users (name, email, phone, role, store_id, password_hash, pin_hash)
VALUES
('Arjun Malhotra', 'owner@urbanclean.com', '9818000001', 'owner', (SELECT id FROM stores WHERE store_name = 'UrbanClean Elite Laundry' LIMIT 1), 'owner_hash', '1111_hash'),
('Neha Kapoor', 'manager@urbanclean.com', '9818000002', 'manager', (SELECT id FROM stores WHERE store_name = 'UrbanClean Elite Laundry' LIMIT 1), 'manager_hash', '2222_hash'),
('Rahul Verma', 'frontdesk@urbanclean.com', '9818000003', 'frontdesk', (SELECT id FROM stores WHERE store_name = 'UrbanClean Elite Laundry' LIMIT 1), 'frontdesk_hash', '3333_hash'),
('Sunita Yadav', 'sorting@urbanclean.com', '9818000004', 'staff', (SELECT id FROM stores WHERE store_name = 'UrbanClean Elite Laundry' LIMIT 1), 'staff_hash', '4444_hash'),
('Imran Khan', 'washing@urbanclean.com', '9818000005', 'staff', (SELECT id FROM stores WHERE store_name = 'UrbanClean Elite Laundry' LIMIT 1), 'staff_hash', '5555_hash'),
('Pooja Sharma', 'ironing@urbanclean.com', '9818000006', 'staff', (SELECT id FROM stores WHERE store_name = 'UrbanClean Elite Laundry' LIMIT 1), 'staff_hash', '6666_hash'),
('Rakesh Singh', 'delivery@urbanclean.com', '9818000007', 'driver', (SELECT id FROM stores WHERE store_name = 'UrbanClean Elite Laundry' LIMIT 1), 'driver_hash', '7777_hash')
ON CONFLICT DO NOTHING;

--

-- 3. Pricing (Realistic enterprise pricing)

INSERT INTO pricing (garment_type, service_type, price, store_id)
VALUES
('Shirt', 'Wash & Iron', 60, (SELECT id FROM stores WHERE store_name = 'UrbanClean Elite Laundry' LIMIT 1)),
('Shirt', 'Dry Cleaning', 90, (SELECT id FROM stores WHERE store_name = 'UrbanClean Elite Laundry' LIMIT 1)),
('Suit', 'Dry Cleaning', 350, (SELECT id FROM stores WHERE store_name = 'UrbanClean Elite Laundry' LIMIT 1)),
('Saree', 'Dry Cleaning', 220, (SELECT id FROM stores WHERE store_name = 'UrbanClean Elite Laundry' LIMIT 1)),
('Bedsheet', 'Wash', 180, (SELECT id FROM stores WHERE store_name = 'UrbanClean Elite Laundry' LIMIT 1)),
('Curtains', 'Dry Cleaning', 400, (SELECT id FROM stores WHERE store_name = 'UrbanClean Elite Laundry' LIMIT 1)),
('Jacket', 'Dry Cleaning', 280, (SELECT id FROM stores WHERE store_name = 'UrbanClean Elite Laundry' LIMIT 1))
ON CONFLICT DO NOTHING;

--

-- 4. Volume Discounts (Enterprise bulk clients)

-- NOTE: In the current DB, `volume_discounts` is global (no `store_id` column).
INSERT INTO volume_discounts (min_quantity, discount_percent, is_active)
SELECT v.min_quantity, v.discount_percent, v.is_active
FROM (
  VALUES
    (10, 5.00::numeric, TRUE),
    (25, 10.00::numeric, TRUE),
    (50, 15.00::numeric, TRUE)
) AS v(min_quantity, discount_percent, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM volume_discounts vd WHERE vd.min_quantity = v.min_quantity
);

--

-- 5. Inventory (High-volume operations)

INSERT INTO inventory (item_name, quantity, unit, reorder_level, store_id)
VALUES
('Liquid Detergent', 200, 'liters', 50, (SELECT id FROM stores WHERE store_name = 'UrbanClean Elite Laundry' LIMIT 1)),
('Dry Cleaning Solvent', 120, 'liters', 30, (SELECT id FROM stores WHERE store_name = 'UrbanClean Elite Laundry' LIMIT 1)),
('Fabric Softener', 80, 'liters', 20, (SELECT id FROM stores WHERE store_name = 'UrbanClean Elite Laundry' LIMIT 1)),
('Stain Remover', 60, 'bottles', 15, (SELECT id FROM stores WHERE store_name = 'UrbanClean Elite Laundry' LIMIT 1)),
('Plastic Hangers', 1500, 'units', 300, (SELECT id FROM stores WHERE store_name = 'UrbanClean Elite Laundry' LIMIT 1)),
('Garment Covers', 1000, 'units', 200, (SELECT id FROM stores WHERE store_name = 'UrbanClean Elite Laundry' LIMIT 1)),
('QR Tags / Labels', 5000, 'units', 1000, (SELECT id FROM stores WHERE store_name = 'UrbanClean Elite Laundry' LIMIT 1))
ON CONFLICT DO NOTHING;

--

-- 6. Machines (Enterprise capacity setup)

INSERT INTO machines (machine_name, machine_type, status, store_id)
VALUES
('Washer Alpha-1', 'washer', 'running', (SELECT id FROM stores WHERE store_name = 'UrbanClean Elite Laundry' LIMIT 1)),
('Washer Alpha-2', 'washer', 'idle', (SELECT id FROM stores WHERE store_name = 'UrbanClean Elite Laundry' LIMIT 1)),
('Dryer Beta-1', 'dryer', 'running', (SELECT id FROM stores WHERE store_name = 'UrbanClean Elite Laundry' LIMIT 1)),
('Dryer Beta-2', 'dryer', 'idle', (SELECT id FROM stores WHERE store_name = 'UrbanClean Elite Laundry' LIMIT 1)),
('DryClean Pro X', 'dry_clean_machine', 'maintenance', (SELECT id FROM stores WHERE store_name = 'UrbanClean Elite Laundry' LIMIT 1)),
('Steam Press Line-1', 'steam_press', 'running', (SELECT id FROM stores WHERE store_name = 'UrbanClean Elite Laundry' LIMIT 1)),
('Steam Press Line-2', 'steam_press', 'idle', (SELECT id FROM stores WHERE store_name = 'UrbanClean Elite Laundry' LIMIT 1))
ON CONFLICT DO NOTHING;

--

-- ✅ End of Enterprise Seed
