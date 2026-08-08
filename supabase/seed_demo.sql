-- Run this script in the Supabase SQL Editor

DO $$
DECLARE
    v_user_id UUID;
    v_restaurant_id UUID;
    v_cat_starters UUID;
    v_cat_mains UUID;
    v_cat_desserts UUID;
    v_cat_drinks UUID;
    v_item_id UUID;
BEGIN
    -- 1. Find the User
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'paullovessoccer@gmail.com' LIMIT 1;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User paullovessoccer@gmail.com not found. Please create the user first in Supabase Auth.';
    END IF;

    -- 2. Create the Restaurant
    INSERT INTO restaurants (name, slug, primary_color, secondary_color, currency)
    VALUES ('The Golden Fork Demo', 'golden-fork-demo', '#F59E0B', '#111827', 'INR')
    RETURNING id INTO v_restaurant_id;

    -- 3. Assign Owner
    INSERT INTO restaurant_staff (user_id, restaurant_id, role)
    VALUES (v_user_id, v_restaurant_id, 'owner');

    -- 4. Create Tables
    INSERT INTO tables (restaurant_id, table_number, display_name, capacity) VALUES
    (v_restaurant_id, 1, 'Table 1', 2),
    (v_restaurant_id, 2, 'Table 2', 4),
    (v_restaurant_id, 3, 'Table 3', 6),
    (v_restaurant_id, 4, 'VIP Table', 8);

    -- 5. Create Categories
    INSERT INTO menu_categories (restaurant_id, name, description, icon_emoji, sort_order) VALUES
    (v_restaurant_id, 'Starters', 'Begin your culinary journey', '🥗', 10) RETURNING id INTO v_cat_starters;
    
    INSERT INTO menu_categories (restaurant_id, name, description, icon_emoji, sort_order) VALUES
    (v_restaurant_id, 'Mains', 'Hearty and fulfilling dishes', '🍝', 20) RETURNING id INTO v_cat_mains;

    INSERT INTO menu_categories (restaurant_id, name, description, icon_emoji, sort_order) VALUES
    (v_restaurant_id, 'Desserts', 'Sweet treats to end your meal', '🍰', 30) RETURNING id INTO v_cat_desserts;

    INSERT INTO menu_categories (restaurant_id, name, description, icon_emoji, sort_order) VALUES
    (v_restaurant_id, 'Drinks', 'Refreshing beverages', '🍹', 40) RETURNING id INTO v_cat_drinks;

    -- 6. Create Menu Items
    -- Starters
    INSERT INTO menu_items (category_id, restaurant_id, name, description, price, image_url, is_featured, dietary_tags)
    VALUES (v_cat_starters, v_restaurant_id, 'Crispy Calamari', 'Lightly breaded squid rings with garlic aioli', 350.00, 'https://images.unsplash.com/photo-1599487405270-8e12eb23b022?q=80&w=800&auto=format&fit=crop', true, ARRAY['dairy_free']::dietary_tag[]);
    
    INSERT INTO menu_items (category_id, restaurant_id, name, description, price, image_url, is_featured, dietary_tags)
    VALUES (v_cat_starters, v_restaurant_id, 'Caprese Salad', 'Fresh mozzarella, tomatoes, and basil with balsamic glaze', 280.00, 'https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?q=80&w=800&auto=format&fit=crop', false, ARRAY['veg', 'gluten_free']::dietary_tag[]);

    -- Mains
    INSERT INTO menu_items (category_id, restaurant_id, name, description, price, image_url, is_featured, dietary_tags)
    VALUES (v_cat_mains, v_restaurant_id, 'Truffle Mushroom Risotto', 'Creamy Arborio rice with wild mushrooms and truffle oil', 550.00, 'https://images.unsplash.com/photo-1633964913295-ceb43826e7cf?q=80&w=800&auto=format&fit=crop', true, ARRAY['veg', 'gluten_free']::dietary_tag[])
    RETURNING id INTO v_item_id;

    -- Add Variations to Risotto
    INSERT INTO menu_item_variations (menu_item_id, name, extra_price) VALUES
    (v_item_id, 'Regular Portion', 0),
    (v_item_id, 'Large Portion', 150.00);

    INSERT INTO menu_items (category_id, restaurant_id, name, description, price, image_url, is_featured, dietary_tags)
    VALUES (v_cat_mains, v_restaurant_id, 'Grilled Salmon', 'Norwegian salmon with asparagus and lemon butter sauce', 850.00, 'https://images.unsplash.com/photo-1485921325833-c519f76c4927?q=80&w=800&auto=format&fit=crop', true, ARRAY['gluten_free']::dietary_tag[]);

    -- Burger with Addons
    INSERT INTO menu_items (category_id, restaurant_id, name, description, price, image_url, is_featured, dietary_tags)
    VALUES (v_cat_mains, v_restaurant_id, 'Classic Smash Burger', 'Double beef patty, cheddar, lettuce, tomato, house sauce', 450.00, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop', false, '{}')
    RETURNING id INTO v_item_id;

    INSERT INTO menu_item_addons (menu_item_id, name, extra_price) VALUES
    (v_item_id, 'Extra Cheese', 50.00),
    (v_item_id, 'Bacon', 90.00),
    (v_item_id, 'Fried Egg', 40.00);

    -- Desserts
    INSERT INTO menu_items (category_id, restaurant_id, name, description, price, image_url, is_featured, dietary_tags)
    VALUES (v_cat_desserts, v_restaurant_id, 'Dark Chocolate Lava Cake', 'Warm gooey center, served with vanilla bean ice cream', 320.00, 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?q=80&w=800&auto=format&fit=crop', true, ARRAY['veg']::dietary_tag[]);
    
    INSERT INTO menu_items (category_id, restaurant_id, name, description, price, image_url, is_featured, dietary_tags)
    VALUES (v_cat_desserts, v_restaurant_id, 'Vegan Matcha Cheesecake', 'Cashew-based matcha cake with almond crust', 350.00, 'https://images.unsplash.com/photo-1508737804141-4c3b688e2546?q=80&w=800&auto=format&fit=crop', false, ARRAY['vegan', 'gluten_free', 'contains_nuts']::dietary_tag[]);

    -- Drinks
    INSERT INTO menu_items (category_id, restaurant_id, name, description, price, image_url, is_featured, dietary_tags)
    VALUES (v_cat_drinks, v_restaurant_id, 'Passionfruit Mojito', 'Fresh passionfruit, mint, lime, white rum, club soda', 400.00, 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=800&auto=format&fit=crop', true, ARRAY['vegan', 'gluten_free']::dietary_tag[]);
    
    INSERT INTO menu_items (category_id, restaurant_id, name, description, price, image_url, is_featured, dietary_tags)
    VALUES (v_cat_drinks, v_restaurant_id, 'Iced Caramel Macchiato', 'Espresso layered with vanilla and milk, topped with caramel', 250.00, 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=800&auto=format&fit=crop', false, ARRAY['veg']::dietary_tag[])
    RETURNING id INTO v_item_id;

    INSERT INTO menu_item_variations (menu_item_id, name, extra_price) VALUES
    (v_item_id, 'Regular', 0),
    (v_item_id, 'Large', 50.00);

    INSERT INTO menu_item_addons (menu_item_id, name, extra_price) VALUES
    (v_item_id, 'Oat Milk', 40.00),
    (v_item_id, 'Almond Milk', 40.00);

END $$;
