ALTER TABLE restaurant_staff ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_waiter_id UUID REFERENCES restaurant_staff(id) ON DELETE SET NULL;
ALTER TABLE waiter_requests ADD COLUMN IF NOT EXISTS assigned_waiter_id UUID REFERENCES restaurant_staff(id) ON DELETE SET NULL;
