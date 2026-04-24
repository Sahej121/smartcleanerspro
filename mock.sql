UPDATE orders SET pickup_status = 'scheduled', logistics_notes = 'Gate code 1234' WHERE id = (SELECT id FROM orders WHERE pickup_status = 'pending' LIMIT 1);
UPDATE orders SET delivery_status = 'scheduled', logistics_notes = 'Leave at door' WHERE id = (SELECT id FROM orders WHERE delivery_status = 'pending' LIMIT 1);
