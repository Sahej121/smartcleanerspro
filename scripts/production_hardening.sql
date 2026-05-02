-- 1. Create Activity Logs Table (INSERT-ONLY)
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    store_id INTEGER REFERENCES stores(id),
    user_id INTEGER REFERENCES users(id),
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    metadata JSONB,
    ip_address TEXT
);

-- Revoke update/delete permissions from everyone on activity_logs
REVOKE UPDATE, DELETE ON activity_logs FROM public, authenticated, service_role;
GRANT INSERT, SELECT ON activity_logs TO authenticated, service_role;

-- 2. Enable Row Level Security (RLS) on core tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies based on store_id
-- We assume store_id is stored in the JWT under 'store_id'

-- Orders Policy
CREATE POLICY store_isolation_orders ON orders
    FOR ALL
    USING (store_id = (auth.jwt() ->> 'store_id')::integer);

-- Order Items Policy
CREATE POLICY store_isolation_order_items ON order_items
    FOR ALL
    USING (EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.id = order_items.order_id 
        AND orders.store_id = (auth.jwt() ->> 'store_id')::integer
    ));

-- Customers Policy
CREATE POLICY store_isolation_customers ON customers
    FOR ALL
    USING (store_id = (auth.jwt() ->> 'store_id')::integer);

-- Inventory Policy
CREATE POLICY store_isolation_inventory ON inventory
    FOR ALL
    USING (store_id = (auth.jwt() ->> 'store_id')::integer);

-- 4. Audit Trigger for Sensitive Mutations (Example: Order Deletions)
CREATE OR REPLACE FUNCTION audit_order_deletion()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO activity_logs (store_id, user_id, action, entity_type, entity_id, metadata)
    VALUES (
        OLD.store_id, 
        (auth.jwt() ->> 'app_user_id')::integer, -- app_user_id is the integer ID
        'DELETE', 
        'order', 
        OLD.id::text, 
        json_build_object('order_number', OLD.order_number)
    );
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_order_deletion
AFTER DELETE ON orders
FOR EACH ROW EXECUTE FUNCTION audit_order_deletion();

-- 5. System Logs Table (if not exists)
CREATE TABLE IF NOT EXISTS system_logs (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    event_type TEXT,
    description TEXT,
    severity TEXT DEFAULT 'info',
    store_id INTEGER REFERENCES stores(id)
);

