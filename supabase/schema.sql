-- =============================================================================
-- Restaurant PWA — Supabase/PostgreSQL Schema
-- Run this entire file in your Supabase SQL Editor (Project > SQL Editor)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- 1. Custom ENUM Types
-- ---------------------------------------------------------------------------
CREATE TYPE order_status AS ENUM (
  'pending',
  'preparing',
  'ready',
  'served',
  'paid',
  'cancelled'
);

CREATE TYPE dietary_tag AS ENUM (
  'veg',
  'vegan',
  'gluten_free',
  'contains_nuts',
  'dairy_free',
  'spicy'
);

CREATE TYPE waiter_request_status AS ENUM (
  'pending',
  'acknowledged',
  'resolved'
);

-- ---------------------------------------------------------------------------
-- 2. Core Tables
-- ---------------------------------------------------------------------------

-- 2.1 Restaurants ---------------------------------------------------------------
CREATE TABLE restaurants (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              TEXT NOT NULL,
  slug              TEXT NOT NULL UNIQUE,
  logo_url          TEXT,
  primary_color     TEXT NOT NULL DEFAULT '#F97316',
  secondary_color   TEXT NOT NULL DEFAULT '#1E293B',
  upi_id            TEXT,
  razorpay_key_id   TEXT,
  stripe_account_id TEXT,
  currency          TEXT NOT NULL DEFAULT 'INR',
  address           TEXT,
  phone             TEXT,
  payu_sub_merchant_id TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.2 Restaurant Staff (auth linkage) ------------------------------------------
-- Must be created early because RLS policies on other tables reference it
CREATE TABLE restaurant_staff (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  role          TEXT NOT NULL DEFAULT 'owner',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, restaurant_id)
);

-- 2.3 Tables (physical restaurant tables) --------------------------------------
CREATE TABLE tables (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id  UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_number   INTEGER NOT NULL,
  display_name   TEXT,
  capacity       INTEGER DEFAULT 4,
  qr_code_url    TEXT,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (restaurant_id, table_number)
);

-- 2.4 Menu Categories ----------------------------------------------------------
CREATE TABLE menu_categories (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  icon_emoji    TEXT DEFAULT '🍽️',
  sort_order    INTEGER NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.5 Menu Items ---------------------------------------------------------------
CREATE TABLE menu_items (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id      UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  restaurant_id    UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  description      TEXT,
  price            NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  image_url        TEXT,
  is_available     BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured      BOOLEAN NOT NULL DEFAULT FALSE,
  dietary_tags     dietary_tag[] DEFAULT '{}',
  preparation_time INTEGER,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.5a Menu Item Variations ---------------------------------------------------
CREATE TABLE menu_item_variations (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_item_id     UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  extra_price      NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (extra_price >= 0),
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.5b Menu Item Addons -------------------------------------------------------
CREATE TABLE menu_item_addons (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_item_id     UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  extra_price      NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (extra_price >= 0),
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.6 Orders -------------------------------------------------------------------
CREATE TABLE orders (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id     UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_id          UUID NOT NULL REFERENCES tables(id) ON DELETE RESTRICT,
  status            order_status NOT NULL DEFAULT 'pending',
  total_amount      NUMERIC(10, 2) NOT NULL DEFAULT 0,
  payment_method    TEXT,
  payment_status    TEXT NOT NULL DEFAULT 'unpaid',
  payment_reference TEXT,
  platform_fee      NUMERIC(10, 2) NOT NULL DEFAULT 0,
  restaurant_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  customer_session  TEXT,
  special_notes     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.7 Order Items --------------------------------------------------------------
CREATE TABLE order_items (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id             UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id         UUID NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
  quantity             INTEGER NOT NULL CHECK (quantity > 0),
  unit_price           NUMERIC(10, 2) NOT NULL,
  variation_name       TEXT,
  variation_price      NUMERIC(10, 2) DEFAULT 0,
  addons               JSONB DEFAULT '[]',
  special_instructions TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.8 Waiter Requests ("Call Waiter" feature) ----------------------------------
CREATE TABLE waiter_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_id        UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  order_id        UUID REFERENCES orders(id) ON DELETE SET NULL,
  status          waiter_request_status NOT NULL DEFAULT 'pending',
  message         TEXT DEFAULT 'Customer requires assistance',
  acknowledged_at TIMESTAMPTZ,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.9 Customer Feedback --------------------------------------------------------
CREATE TABLE customer_feedback (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_id        UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rating          INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 3. Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX idx_tables_restaurant        ON tables(restaurant_id);
CREATE INDEX idx_menu_categories_rest     ON menu_categories(restaurant_id, sort_order);
CREATE INDEX idx_menu_items_category      ON menu_items(category_id);
CREATE INDEX idx_menu_items_restaurant    ON menu_items(restaurant_id, is_available);
CREATE INDEX idx_menu_variations_item     ON menu_item_variations(menu_item_id);
CREATE INDEX idx_menu_addons_item         ON menu_item_addons(menu_item_id);
CREATE INDEX idx_orders_restaurant_status ON orders(restaurant_id, status, created_at DESC);
CREATE INDEX idx_orders_table             ON orders(table_id, created_at DESC);
CREATE INDEX idx_order_items_order        ON order_items(order_id);
CREATE INDEX idx_waiter_requests_rest     ON waiter_requests(restaurant_id, status);
CREATE INDEX idx_feedback_restaurant      ON customer_feedback(restaurant_id, rating);

-- ---------------------------------------------------------------------------
-- 4. Triggers — auto-update updated_at
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_restaurants_updated_at
  BEFORE UPDATE ON restaurants FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_tables_updated_at
  BEFORE UPDATE ON tables FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_menu_categories_updated_at
  BEFORE UPDATE ON menu_categories FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_menu_items_updated_at
  BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- 5. Trigger — auto-recalculate order total on item insert/update/delete
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION recalculate_order_total()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  new_total NUMERIC(10, 2);
  v_total_amount NUMERIC(10, 2);
  v_platform_fee NUMERIC(10, 2);
  v_master_amount NUMERIC(10, 2);
  v_restaurant_amount NUMERIC(10, 2);
BEGIN
  -- Food Cost (sum of items)
  SELECT COALESCE(SUM(quantity * unit_price), 0)
  INTO new_total
  FROM order_items
  WHERE order_id = COALESCE(NEW.order_id, OLD.order_id);

  -- Calculations according to PayU Marketplace Split Logic
  -- Total Amount = Food Cost + 5% Food GST
  v_total_amount := ROUND(new_total * 1.05, 2);
  
  -- Platform Fee = 2% of Food Cost
  v_platform_fee := ROUND(new_total * 0.02, 2);
  
  -- Master Account = Platform Fee + 18% GST on Platform Fee
  v_master_amount := ROUND(v_platform_fee * 1.18, 2);
  
  -- Sub-Merchant / Restaurant Account = Remaining balance
  v_restaurant_amount := v_total_amount - v_master_amount;

  UPDATE orders
  SET 
    total_amount = v_total_amount,
    platform_fee = v_platform_fee,
    restaurant_amount = v_restaurant_amount
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_order_items_total
  AFTER INSERT OR UPDATE OR DELETE ON order_items
  FOR EACH ROW EXECUTE FUNCTION recalculate_order_total();

-- ---------------------------------------------------------------------------
-- 6. Row-Level Security (RLS)
-- ---------------------------------------------------------------------------
ALTER TABLE restaurants       ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_staff  ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables            ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_addons  ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders            ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiter_requests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_feedback ENABLE ROW LEVEL SECURITY;

-- Helper: get calling user's restaurant_id
CREATE OR REPLACE FUNCTION my_restaurant_id()
RETURNS UUID LANGUAGE sql STABLE AS $$
  SELECT restaurant_id FROM restaurant_staff
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- ---- restaurants ----
CREATE POLICY "public_read_active_restaurants"
  ON restaurants FOR SELECT USING (is_active = TRUE);

CREATE POLICY "owner_manage_own_restaurant"
  ON restaurants FOR ALL TO authenticated
  USING (id = my_restaurant_id())
  WITH CHECK (id = my_restaurant_id());

-- ---- restaurant_staff ----
CREATE POLICY "staff_read_own_membership"
  ON restaurant_staff FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ---- tables ----
CREATE POLICY "public_read_active_tables"
  ON tables FOR SELECT USING (is_active = TRUE);

CREATE POLICY "owner_manage_own_tables"
  ON tables FOR ALL TO authenticated
  USING (restaurant_id = my_restaurant_id())
  WITH CHECK (restaurant_id = my_restaurant_id());

-- ---- menu_categories ----
CREATE POLICY "public_read_active_categories"
  ON menu_categories FOR SELECT USING (is_active = TRUE);

CREATE POLICY "owner_manage_own_categories"
  ON menu_categories FOR ALL TO authenticated
  USING (restaurant_id = my_restaurant_id())
  WITH CHECK (restaurant_id = my_restaurant_id());

-- ---- menu_items ----
-- Anon sees only available items; admin sees all (including unavailable)
CREATE POLICY "public_read_available_items"
  ON menu_items FOR SELECT TO anon USING (is_available = TRUE);

CREATE POLICY "owner_read_all_items"
  ON menu_items FOR SELECT TO authenticated
  USING (restaurant_id = my_restaurant_id());

CREATE POLICY "owner_manage_own_items"
  ON menu_items FOR INSERT, UPDATE, DELETE TO authenticated
  USING (restaurant_id = my_restaurant_id())
  WITH CHECK (restaurant_id = my_restaurant_id());

-- ---- menu_item_variations & addons ----
CREATE POLICY "public_read_variations"
  ON menu_item_variations FOR SELECT TO anon USING (TRUE);
CREATE POLICY "owner_all_variations"
  ON menu_item_variations FOR ALL TO authenticated
  USING (menu_item_id IN (SELECT id FROM menu_items WHERE restaurant_id = my_restaurant_id()));

CREATE POLICY "public_read_addons"
  ON menu_item_addons FOR SELECT TO anon USING (TRUE);
CREATE POLICY "owner_all_addons"
  ON menu_item_addons FOR ALL TO authenticated
  USING (menu_item_id IN (SELECT id FROM menu_items WHERE restaurant_id = my_restaurant_id()));

-- ---- orders ----
-- REMOVED: anon_insert_orders (use /api/orders endpoint instead)
-- REMOVED: anon_read_own_orders (use /api/orders/[id] endpoint instead)

CREATE POLICY "owner_all_restaurant_orders"
  ON orders FOR ALL TO authenticated
  USING (restaurant_id = my_restaurant_id())
  WITH CHECK (restaurant_id = my_restaurant_id());

-- ---- order_items ----
-- REMOVED: anon_insert_order_items
-- REMOVED: anon_read_order_items

CREATE POLICY "owner_all_order_items"
  ON order_items FOR ALL TO authenticated
  USING (
    order_id IN (
      SELECT id FROM orders WHERE restaurant_id = my_restaurant_id()
    )
  );

-- ---- waiter_requests ----
-- REMOVED: anon_insert_waiter_requests

CREATE POLICY "owner_manage_waiter_requests"
  ON waiter_requests FOR ALL TO authenticated
  USING (restaurant_id = my_restaurant_id())
  WITH CHECK (restaurant_id = my_restaurant_id());

-- ---- customer_feedback ----
CREATE POLICY "anon_insert_feedback"
  ON customer_feedback FOR INSERT TO anon
  WITH CHECK (TRUE);

CREATE POLICY "owner_read_feedback"
  ON customer_feedback FOR SELECT TO authenticated
  USING (restaurant_id = my_restaurant_id());

-- ---------------------------------------------------------------------------
-- 7. Enable Real-Time Subscriptions
-- (Run in Supabase Dashboard > Database > Replication if SQL fails)
-- ---------------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE waiter_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE menu_items;

-- ---------------------------------------------------------------------------
-- 8. Seed Data (development / testing)
-- ---------------------------------------------------------------------------
INSERT INTO restaurants (id, name, slug, primary_color, secondary_color, upi_id, currency)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001'::uuid,
  'The Golden Fork',
  'golden-fork',
  '#F97316',
  '#1E293B',
  'goldenfork@upi',
  'INR'
);

INSERT INTO tables (restaurant_id, table_number, display_name, capacity) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 1, 'Window Table 1',   4),
  ('a1b2c3d4-0000-0000-0000-000000000001', 2, 'Window Table 2',   4),
  ('a1b2c3d4-0000-0000-0000-000000000001', 3, 'Center Table 3',   6),
  ('a1b2c3d4-0000-0000-0000-000000000001', 4, 'Booth 4',           2),
  ('a1b2c3d4-0000-0000-0000-000000000001', 5, 'Rooftop Table 5',   4);

INSERT INTO menu_categories (restaurant_id, name, icon_emoji, sort_order) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Starters',   '🥗', 1),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Mains',       '🍛', 2),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Desserts',    '🍮', 4),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Beverages',   '🥤', 5);

-- ---------------------------------------------------------------------------
-- 9. RPC Functions (Stored Procedures)
-- ---------------------------------------------------------------------------

-- Atomic place_order RPC
CREATE OR REPLACE FUNCTION place_order(
  p_restaurant_id UUID,
  p_table_id UUID,
  p_special_instructions TEXT,
  p_items JSONB -- Array of { "menu_item_id": "uuid", "quantity": number, "variation_id": "uuid", "addon_ids": ["uuid"], "special_instructions": "text" }
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges to ensure atomic insert
AS $$
DECLARE
  v_order_id UUID;
  v_item JSONB;
  v_menu_item_price NUMERIC(10, 2);
  v_variation_price NUMERIC(10, 2);
  v_variation_name TEXT;
  v_addon_id UUID;
  v_addon_price NUMERIC(10, 2);
  v_addon_name TEXT;
  v_addons_json JSONB;
  v_addon JSONB;
  v_total_unit_price NUMERIC(10, 2);
BEGIN
  -- 0. Security Validation: Ensure table belongs to restaurant
  IF NOT EXISTS (
    SELECT 1 FROM tables 
    WHERE id = p_table_id AND restaurant_id = p_restaurant_id
  ) THEN
    RAISE EXCEPTION 'Invalid table_id for this restaurant';
  END IF;

  -- 1. Create order header
  INSERT INTO orders (restaurant_id, table_id, special_notes, status)
  VALUES (p_restaurant_id, p_table_id, p_special_instructions, 'pending')
  RETURNING id INTO v_order_id;

  -- 2. Insert items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Get current price from menu_items securely
    SELECT price INTO v_menu_item_price
    FROM menu_items
    WHERE id = (v_item->>'menu_item_id')::UUID;
    
    IF v_menu_item_price IS NULL THEN
      RAISE EXCEPTION 'Invalid menu item ID: %', (v_item->>'menu_item_id');
    END IF;

    -- Handle variation
    v_variation_price := 0;
    v_variation_name := NULL;
    IF v_item->>'variation_id' IS NOT NULL THEN
      SELECT extra_price, name INTO v_variation_price, v_variation_name
      FROM menu_item_variations
      WHERE id = (v_item->>'variation_id')::UUID AND menu_item_id = (v_item->>'menu_item_id')::UUID;
      
      IF v_variation_name IS NULL THEN
        RAISE EXCEPTION 'Invalid variation ID';
      END IF;
    END IF;

    -- Handle addons
    v_addons_json := '[]'::JSONB;
    v_total_unit_price := v_menu_item_price + v_variation_price;
    
    IF v_item->'addon_ids' IS NOT NULL AND jsonb_array_length(v_item->'addon_ids') > 0 THEN
      FOR v_addon IN SELECT * FROM jsonb_array_elements(v_item->'addon_ids')
      LOOP
        SELECT extra_price, name INTO v_addon_price, v_addon_name
        FROM menu_item_addons
        WHERE id = (v_addon#>>'{}')::UUID AND menu_item_id = (v_item->>'menu_item_id')::UUID;
        
        IF v_addon_name IS NOT NULL THEN
          v_addons_json := v_addons_json || jsonb_build_object('name', v_addon_name, 'price', v_addon_price);
          v_total_unit_price := v_total_unit_price + v_addon_price;
        END IF;
      END LOOP;
    END IF;

    INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, variation_name, variation_price, addons, special_instructions)
    VALUES (
      v_order_id, 
      (v_item->>'menu_item_id')::UUID, 
      (v_item->>'quantity')::INTEGER, 
      v_total_unit_price,
      v_variation_name,
      v_variation_price,
      v_addons_json,
      v_item->>'special_instructions'
    );
  END LOOP;

  -- Return the created order ID (trigger will automatically calculate totals and fees)
  RETURN v_order_id;
END;
$$;
