// =============================================================
// Comprehensive mock data for "The Golden Fork" restaurant
// Used when PUBLIC_USE_MOCK=true (no Supabase connection needed)
// =============================================================

import type {
  Restaurant,
  Table,
  MenuCategory,
  MenuItem,
  Order,
  OrderItemWithMenuItem,
  WaiterRequest
} from './types';

// ─── Restaurant ──────────────────────────────────────────────
export const MOCK_RESTAURANT: Restaurant = {
  id: 'a1b2c3d4-0000-0000-0000-000000000001',
  name: 'The Golden Fork',
  slug: 'golden-fork',
  logo_url: null,
  primary_color: '#F97316',
  secondary_color: '#1E293B',
  upi_id: 'goldenfork@upi',
  razorpay_key_id: 'rzp_test_placeholder',
  stripe_account_id: null,
  currency: 'INR',
  address: '12 Connaught Place, New Delhi — 110001',
  phone: '+91 98765 43210',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

// ─── Tables ──────────────────────────────────────────────────
export const MOCK_TABLES: Table[] = [
  { id: 't1', restaurant_id: MOCK_RESTAURANT.id, table_number: 1, display_name: 'Garden Table 1', capacity: 4, qr_code_url: null, is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 't2', restaurant_id: MOCK_RESTAURANT.id, table_number: 2, display_name: 'Garden Table 2', capacity: 4, qr_code_url: null, is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 't3', restaurant_id: MOCK_RESTAURANT.id, table_number: 3, display_name: 'Center Table 3', capacity: 6, qr_code_url: null, is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 't4', restaurant_id: MOCK_RESTAURANT.id, table_number: 4, display_name: 'Booth 4',         capacity: 2, qr_code_url: null, is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 't5', restaurant_id: MOCK_RESTAURANT.id, table_number: 5, display_name: 'Rooftop 5',       capacity: 4, qr_code_url: null, is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 't6', restaurant_id: MOCK_RESTAURANT.id, table_number: 6, display_name: 'VIP Lounge 6',    capacity: 8, qr_code_url: null, is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
];

// ─── Categories ──────────────────────────────────────────────
export const MOCK_CATEGORIES: MenuCategory[] = [
  { id: 'cat1', restaurant_id: MOCK_RESTAURANT.id, name: 'Starters',   description: 'Light bites to begin your journey', icon_emoji: '🥗', sort_order: 1, is_active: true },
  { id: 'cat2', restaurant_id: MOCK_RESTAURANT.id, name: 'Mains',       description: 'Hearty curries and rice dishes',       icon_emoji: '🍛', sort_order: 2, is_active: true },
  { id: 'cat3', restaurant_id: MOCK_RESTAURANT.id, name: 'Breads',      description: 'Freshly baked from the tandoor',       icon_emoji: '🫓', sort_order: 3, is_active: true },
  { id: 'cat4', restaurant_id: MOCK_RESTAURANT.id, name: 'Desserts',    description: 'Sweet endings to a perfect meal',       icon_emoji: '🍮', sort_order: 4, is_active: true },
  { id: 'cat5', restaurant_id: MOCK_RESTAURANT.id, name: 'Beverages',   description: 'Refreshing drinks and chai',            icon_emoji: '🥤', sort_order: 5, is_active: true },
];

// ─── Menu Items ──────────────────────────────────────────────
const now = new Date().toISOString();

export const MOCK_MENU_ITEMS: MenuItem[] = [
  // STARTERS
  {
    id: 'i01', category_id: 'cat1', restaurant_id: MOCK_RESTAURANT.id,
    name: 'Paneer Tikka',
    description: 'Marinated cottage cheese cubes grilled in tandoor with smoky spices and mint chutney.',
    price: 299, image_url: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80',
    is_available: true, is_featured: true, dietary_tags: ['veg'], preparation_time: 15, sort_order: 1,
    created_at: now, updated_at: now
  },
  {
    id: 'i02', category_id: 'cat1', restaurant_id: MOCK_RESTAURANT.id,
    name: 'Chicken Tikka',
    description: 'Succulent chicken pieces marinated in yoghurt and spices, charred to perfection.',
    price: 349, image_url: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=800&q=80',
    is_available: true, is_featured: false, dietary_tags: ['spicy'], preparation_time: 20, sort_order: 2,
    created_at: now, updated_at: now
  },
  {
    id: 'i03', category_id: 'cat1', restaurant_id: MOCK_RESTAURANT.id,
    name: 'Crispy Samosa (2 pcs)',
    description: 'Golden-fried pastry pockets filled with spiced potatoes and peas. Served with tamarind chutney.',
    price: 149, image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
    is_available: true, is_featured: false, dietary_tags: ['veg', 'vegan'], preparation_time: 10, sort_order: 3,
    created_at: now, updated_at: now
  },
  {
    id: 'i04', category_id: 'cat1', restaurant_id: MOCK_RESTAURANT.id,
    name: 'Dal Shorba',
    description: 'Velvety lentil soup tempered with cumin, ginger and fresh coriander.',
    price: 199, image_url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80',
    is_available: true, is_featured: false, dietary_tags: ['veg', 'vegan', 'gluten_free'], preparation_time: 10, sort_order: 4,
    created_at: now, updated_at: now
  },
  {
    id: 'i05', category_id: 'cat1', restaurant_id: MOCK_RESTAURANT.id,
    name: 'Seekh Kebab',
    description: 'Minced lamb mixed with fresh herbs, shaped on skewers and grilled over charcoal.',
    price: 379, image_url: 'https://images.unsplash.com/photo-1663621386-08a38f1e4e96?auto=format&fit=crop&w=800&q=80',
    is_available: false, is_featured: false, dietary_tags: ['spicy'], preparation_time: 20, sort_order: 5,
    created_at: now, updated_at: now
  },

  // MAINS
  {
    id: 'i06', category_id: 'cat2', restaurant_id: MOCK_RESTAURANT.id,
    name: 'Butter Chicken',
    description: 'Tender chicken in a rich, creamy tomato-butter sauce. Our most-loved dish.',
    price: 449, image_url: 'https://images.unsplash.com/photo-1585937421612-70a8d5f8b9e0?auto=format&fit=crop&w=800&q=80',
    is_available: true, is_featured: true, dietary_tags: ['gluten_free'], preparation_time: 20, sort_order: 1,
    created_at: now, updated_at: now
  },
  {
    id: 'i07', category_id: 'cat2', restaurant_id: MOCK_RESTAURANT.id,
    name: 'Dal Makhani',
    description: 'Slow-cooked black lentils simmered overnight with butter and cream. Iconic flavour.',
    price: 349, image_url: 'https://images.unsplash.com/photo-1534939561126-9b807a7c6a96?auto=format&fit=crop&w=800&q=80',
    is_available: true, is_featured: true, dietary_tags: ['veg', 'gluten_free'], preparation_time: 15, sort_order: 2,
    created_at: now, updated_at: now
  },
  {
    id: 'i08', category_id: 'cat2', restaurant_id: MOCK_RESTAURANT.id,
    name: 'Lamb Biryani',
    description: 'Fragrant basmati rice layered with slow-cooked spiced lamb, saffron and caramelised onions.',
    price: 549, image_url: 'https://images.unsplash.com/photo-1563379091339-03246963d452?auto=format&fit=crop&w=800&q=80',
    is_available: true, is_featured: true, dietary_tags: ['spicy', 'gluten_free'], preparation_time: 30, sort_order: 3,
    created_at: now, updated_at: now
  },
  {
    id: 'i09', category_id: 'cat2', restaurant_id: MOCK_RESTAURANT.id,
    name: 'Palak Paneer',
    description: 'Fresh cottage cheese cubes in a velvety, spiced spinach gravy.',
    price: 329, image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    is_available: true, is_featured: false, dietary_tags: ['veg', 'gluten_free'], preparation_time: 15, sort_order: 4,
    created_at: now, updated_at: now
  },
  {
    id: 'i10', category_id: 'cat2', restaurant_id: MOCK_RESTAURANT.id,
    name: 'Chana Masala',
    description: 'Chickpeas simmered in a tangy, robust tomato-onion masala. 100% plant-based.',
    price: 279, image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    is_available: true, is_featured: false, dietary_tags: ['veg', 'vegan', 'gluten_free'], preparation_time: 15, sort_order: 5,
    created_at: now, updated_at: now
  },

  // BREADS
  {
    id: 'i11', category_id: 'cat3', restaurant_id: MOCK_RESTAURANT.id,
    name: 'Butter Naan',
    description: 'Leavened flatbread baked in the tandoor, slathered with golden butter.',
    price: 79, image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80',
    is_available: true, is_featured: false, dietary_tags: ['veg'], preparation_time: 8, sort_order: 1,
    created_at: now, updated_at: now
  },
  {
    id: 'i12', category_id: 'cat3', restaurant_id: MOCK_RESTAURANT.id,
    name: 'Garlic & Herb Naan',
    description: 'Tandoor-baked naan brushed with garlic butter and fresh coriander.',
    price: 99, image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80',
    is_available: true, is_featured: false, dietary_tags: ['veg'], preparation_time: 8, sort_order: 2,
    created_at: now, updated_at: now
  },
  {
    id: 'i13', category_id: 'cat3', restaurant_id: MOCK_RESTAURANT.id,
    name: 'Stuffed Paratha',
    description: 'Whole-wheat flatbread stuffed with spiced potato and served with yoghurt.',
    price: 129, image_url: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80',
    is_available: true, is_featured: false, dietary_tags: ['veg'], preparation_time: 12, sort_order: 3,
    created_at: now, updated_at: now
  },

  // DESSERTS
  {
    id: 'i14', category_id: 'cat4', restaurant_id: MOCK_RESTAURANT.id,
    name: 'Gulab Jamun (2 pcs)',
    description: 'Melt-in-your-mouth milk-solid dumplings soaked in rose-cardamom syrup.',
    price: 149, image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
    is_available: true, is_featured: false, dietary_tags: ['veg'], preparation_time: 5, sort_order: 1,
    created_at: now, updated_at: now
  },
  {
    id: 'i15', category_id: 'cat4', restaurant_id: MOCK_RESTAURANT.id,
    name: 'Mango Kulfi',
    description: 'Dense, frozen dessert made with reduced milk, fresh Alphonso mango and pistachios.',
    price: 179, image_url: 'https://images.unsplash.com/photo-1488900128323-21503983a07e?auto=format&fit=crop&w=800&q=80',
    is_available: true, is_featured: true, dietary_tags: ['veg', 'gluten_free'], preparation_time: 0, sort_order: 2,
    created_at: now, updated_at: now
  },

  // BEVERAGES
  {
    id: 'i16', category_id: 'cat5', restaurant_id: MOCK_RESTAURANT.id,
    name: 'Mango Lassi',
    description: 'Thick, chilled blend of yoghurt, fresh Alphonso mango pulp and a hint of cardamom.',
    price: 149, image_url: 'https://images.unsplash.com/photo-1627308595171-d1b5d67129e4?auto=format&fit=crop&w=800&q=80',
    is_available: true, is_featured: false, dietary_tags: ['veg', 'gluten_free'], preparation_time: 3, sort_order: 1,
    created_at: now, updated_at: now
  },
  {
    id: 'i17', category_id: 'cat5', restaurant_id: MOCK_RESTAURANT.id,
    name: 'Masala Chai',
    description: 'Spiced Indian tea brewed with ginger, cardamom, cinnamon and fresh milk.',
    price: 99, image_url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80',
    is_available: true, is_featured: false, dietary_tags: ['veg', 'gluten_free'], preparation_time: 5, sort_order: 2,
    created_at: now, updated_at: now
  },
  {
    id: 'i18', category_id: 'cat5', restaurant_id: MOCK_RESTAURANT.id,
    name: 'Fresh Lime Soda',
    description: 'Freshly squeezed lime with chaat masala on chilled sparkling water. Sweet or salted.',
    price: 89, image_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80',
    is_available: true, is_featured: false, dietary_tags: ['veg', 'vegan', 'gluten_free'], preparation_time: 3, sort_order: 3,
    created_at: now, updated_at: now
  },
];

// ─── Sample KDS Orders ────────────────────────────────────────
export function makeMockOrders(): Order[] {
  const item = (id: string, menuId: string, qty: number, price: number): OrderItemWithMenuItem => ({
    id,
    order_id: '',
    menu_item_id: menuId,
    quantity: qty,
    unit_price: price,
    special_instructions: null,
    created_at: new Date().toISOString(),
    menu_item: MOCK_MENU_ITEMS.find((m) => m.id === menuId)!
  });

  return [
    {
      id: 'ord-001',
      restaurant_id: MOCK_RESTAURANT.id,
      table_id: 't1',
      status: 'pending',
      total_amount: 897,
      payment_method: null,
      payment_status: 'unpaid',
      payment_reference: null,
      customer_session: 'sess-demo-1',
      special_notes: 'Extra spicy please',
      created_at: new Date(Date.now() - 3 * 60000).toISOString(),
      updated_at: new Date(Date.now() - 3 * 60000).toISOString(),
      table: MOCK_TABLES[0],
      order_items: [
        item('oi-01a', 'i01', 1, 299),
        item('oi-01b', 'i06', 1, 449),
        item('oi-01c', 'i11', 1, 79),
        item('oi-01d', 'i17', 1, 99),
      ]
    },
    {
      id: 'ord-002',
      restaurant_id: MOCK_RESTAURANT.id,
      table_id: 't3',
      status: 'preparing',
      total_amount: 1247,
      payment_method: null,
      payment_status: 'unpaid',
      payment_reference: null,
      customer_session: 'sess-demo-2',
      special_notes: null,
      created_at: new Date(Date.now() - 12 * 60000).toISOString(),
      updated_at: new Date(Date.now() - 8 * 60000).toISOString(),
      table: MOCK_TABLES[2],
      order_items: [
        item('oi-02a', 'i08', 2, 549),
        item('oi-02b', 'i03', 1, 149),
      ]
    },
    {
      id: 'ord-003',
      restaurant_id: MOCK_RESTAURANT.id,
      table_id: 't2',
      status: 'ready',
      total_amount: 698,
      payment_method: null,
      payment_status: 'unpaid',
      payment_reference: null,
      customer_session: 'sess-demo-3',
      special_notes: 'No onion please',
      created_at: new Date(Date.now() - 20 * 60000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 60000).toISOString(),
      table: MOCK_TABLES[1],
      order_items: [
        item('oi-03a', 'i07', 1, 349),
        item('oi-03b', 'i12', 2, 99),
        item('oi-03c', 'i16', 1, 149),
      ]
    },
    {
      id: 'ord-004',
      restaurant_id: MOCK_RESTAURANT.id,
      table_id: 't5',
      status: 'served',
      total_amount: 826,
      payment_method: null,
      payment_status: 'unpaid',
      payment_reference: null,
      customer_session: 'sess-demo-4',
      special_notes: null,
      created_at: new Date(Date.now() - 35 * 60000).toISOString(),
      updated_at: new Date(Date.now() - 15 * 60000).toISOString(),
      table: MOCK_TABLES[4],
      order_items: [
        item('oi-04a', 'i09', 1, 329),
        item('oi-04b', 'i10', 1, 279),
        item('oi-04c', 'i15', 1, 179),
        item('oi-04d', 'i18', 1, 89),
      ]
    }
  ];
}

// ─── Waiter Requests ──────────────────────────────────────────
export function makeMockWaiterRequests(): WaiterRequest[] {
  return [
    {
      id: 'wr-001',
      restaurant_id: MOCK_RESTAURANT.id,
      table_id: 't4',
      order_id: null,
      status: 'pending',
      message: 'Customer requires assistance',
      acknowledged_at: null,
      resolved_at: null,
      created_at: new Date(Date.now() - 2 * 60000).toISOString(),
      table: MOCK_TABLES[3]
    }
  ];
}
