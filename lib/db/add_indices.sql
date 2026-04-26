-- Performance Optimization Indices
-- Target: Foreign keys and columns used in frequent JOINs, GROUP BYs, and WHERE clauses

-- Customers optimization
CREATE INDEX IF NOT EXISTS idx_customers_store_id ON customers(store_id);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at DESC);

-- Orders optimization
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- Order Items optimization
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_status ON order_items(status);
CREATE INDEX IF NOT EXISTS idx_order_items_tag_id ON order_items(tag_id);

-- System Logs optimization
CREATE INDEX IF NOT EXISTS idx_system_logs_store_id ON system_logs(store_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);

-- Pricing optimization
CREATE INDEX IF NOT EXISTS idx_pricing_store_id ON pricing(store_id);

-- Inventory optimization
CREATE INDEX IF NOT EXISTS idx_inventory_store_id ON inventory(store_id);
