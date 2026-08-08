-- Run this script in the Supabase SQL Editor
-- Make sure to clear the editor before pasting!

-- 1. Create the Restaurant
INSERT INTO restaurants (id, name, slug, owner_id)
VALUES (
    'd793b827-0466-4cf8-8424-df38d21c0eb2',
    'The Golden Fork Demo', 
    'golden-fork-demo', 
    '57a00043-ea19-4059-9e35-5b0b2d1580e6'
) ON CONFLICT (id) DO NOTHING;

-- 2. Assign Owner (Staff Table)
INSERT INTO restaurant_staff (user_id, restaurant_id, role)
VALUES (
    '57a00043-ea19-4059-9e35-5b0b2d1580e6',
    'd793b827-0466-4cf8-8424-df38d21c0eb2',
    'owner'
) ON CONFLICT DO NOTHING;

-- 3. Create Tables
INSERT INTO tables (restaurant_id, table_number, display_name) VALUES
('d793b827-0466-4cf8-8424-df38d21c0eb2', 1, 'Table 1'),
('d793b827-0466-4cf8-8424-df38d21c0eb2', 2, 'Table 2'),
('d793b827-0466-4cf8-8424-df38d21c0eb2', 3, 'Table 3'),
('d793b827-0466-4cf8-8424-df38d21c0eb2', 4, 'VIP Table');

-- 4. Create Categories
INSERT INTO menu_categories (id, restaurant_id, name, icon_emoji, sort_order) VALUES
('f52e5d7a-1153-4889-b88a-e5e78ecae921', 'd793b827-0466-4cf8-8424-df38d21c0eb2', 'Starters', '🥗', 10),
('e4b3e8e1-d3c2-4eb2-a8c6-55a0f6229555', 'd793b827-0466-4cf8-8424-df38d21c0eb2', 'Mains', '🍝', 20),
('2a9b1c7c-4a33-4f9e-bc4b-e8d98d28c344', 'd793b827-0466-4cf8-8424-df38d21c0eb2', 'Desserts', '🍰', 30),
('c8d76d4a-a92c-4f81-bfd0-7a31b268f7aa', 'd793b827-0466-4cf8-8424-df38d21c0eb2', 'Drinks', '🍹', 40)
ON CONFLICT (id) DO NOTHING;

-- 5. Create Menu Items
-- Starters
INSERT INTO menu_items (category_id, restaurant_id, name, description, price, image_url, dietary_tags) VALUES 
('f52e5d7a-1153-4889-b88a-e5e78ecae921', 'd793b827-0466-4cf8-8424-df38d21c0eb2', 'Crispy Calamari', 'Lightly breaded squid rings with garlic aioli', 350.00, 'https://images.unsplash.com/photo-1599487405270-8e12eb23b022?q=80&w=800&auto=format&fit=crop', '{"dairy_free"}'),
('f52e5d7a-1153-4889-b88a-e5e78ecae921', 'd793b827-0466-4cf8-8424-df38d21c0eb2', 'Caprese Salad', 'Fresh mozzarella, tomatoes, and basil with balsamic glaze', 280.00, 'https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?q=80&w=800&auto=format&fit=crop', '{"veg", "gluten_free"}');

-- Mains
INSERT INTO menu_items (category_id, restaurant_id, name, description, price, image_url, dietary_tags) VALUES 
('e4b3e8e1-d3c2-4eb2-a8c6-55a0f6229555', 'd793b827-0466-4cf8-8424-df38d21c0eb2', 'Truffle Mushroom Risotto', 'Creamy Arborio rice with wild mushrooms and truffle oil', 550.00, 'https://images.unsplash.com/photo-1633964913295-ceb43826e7cf?q=80&w=800&auto=format&fit=crop', '{"veg", "gluten_free"}'),
('e4b3e8e1-d3c2-4eb2-a8c6-55a0f6229555', 'd793b827-0466-4cf8-8424-df38d21c0eb2', 'Grilled Salmon', 'Norwegian salmon with asparagus and lemon butter sauce', 850.00, 'https://images.unsplash.com/photo-1485921325833-c519f76c4927?q=80&w=800&auto=format&fit=crop', '{"gluten_free"}'),
('e4b3e8e1-d3c2-4eb2-a8c6-55a0f6229555', 'd793b827-0466-4cf8-8424-df38d21c0eb2', 'Classic Smash Burger', 'Double beef patty, cheddar, lettuce, tomato, house sauce', 450.00, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop', '{}');

-- Desserts
INSERT INTO menu_items (category_id, restaurant_id, name, description, price, image_url, dietary_tags) VALUES 
('2a9b1c7c-4a33-4f9e-bc4b-e8d98d28c344', 'd793b827-0466-4cf8-8424-df38d21c0eb2', 'Dark Chocolate Lava Cake', 'Warm gooey center, served with vanilla bean ice cream', 320.00, 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?q=80&w=800&auto=format&fit=crop', '{"veg"}'),
('2a9b1c7c-4a33-4f9e-bc4b-e8d98d28c344', 'd793b827-0466-4cf8-8424-df38d21c0eb2', 'Vegan Matcha Cheesecake', 'Cashew-based matcha cake with almond crust', 350.00, 'https://images.unsplash.com/photo-1508737804141-4c3b688e2546?q=80&w=800&auto=format&fit=crop', '{"vegan", "gluten_free", "contains_nuts"}');

-- Drinks
INSERT INTO menu_items (category_id, restaurant_id, name, description, price, image_url, dietary_tags) VALUES 
('c8d76d4a-a92c-4f81-bfd0-7a31b268f7aa', 'd793b827-0466-4cf8-8424-df38d21c0eb2', 'Passionfruit Mojito', 'Fresh passionfruit, mint, lime, white rum, club soda', 400.00, 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=800&auto=format&fit=crop', '{"vegan", "gluten_free"}'),
('c8d76d4a-a92c-4f81-bfd0-7a31b268f7aa', 'd793b827-0466-4cf8-8424-df38d21c0eb2', 'Iced Caramel Macchiato', 'Espresso layered with vanilla and milk, topped with caramel', 250.00, 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=800&auto=format&fit=crop', '{"veg"}');
