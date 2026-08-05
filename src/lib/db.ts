import { supabase } from './supabase';
import { MOCK_RESTAURANT, MOCK_TABLES, MOCK_CATEGORIES, MOCK_MENU_ITEMS } from './mock-data';
import type { Restaurant, Table, MenuCategory, MenuItem } from './types';

function isDemoRestaurant(id: string) {
  return id === MOCK_RESTAURANT.id;
}

function demoTable(id: string) {
  return MOCK_TABLES.find((t) => t.id === id) ?? null;
}

// ==========================================
// 1. Fetching Data
// ==========================================

export async function getRestaurant(id: string): Promise<Restaurant | null> {
  if (!supabase) {
    return MOCK_RESTAURANT;
  }

  // Demo landing-page IDs are not UUIDs / may not exist in Supabase yet
  if (isDemoRestaurant(id)) {
    const { data } = await supabase.from('restaurants').select('*').eq('id', id).maybeSingle();
    return (data as Restaurant) ?? MOCK_RESTAURANT;
  }

  const { data, error } = await supabase.from('restaurants').select('*').eq('id', id).maybeSingle();

  if (error) {
    console.error('getRestaurant:', error.message);
    return null;
  }
  return (data as Restaurant) ?? null;
}

export async function getTable(id: string): Promise<Table | null> {
  const mock = demoTable(id);

  if (!supabase) {
    return mock;
  }

  // Mock table ids like "t1" are not UUIDs — skip DB and serve demo data
  if (mock) {
    const looksLikeUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!looksLikeUuid) return mock;

    const { data } = await supabase.from('tables').select('*').eq('id', id).maybeSingle();
    return (data as Table) ?? mock;
  }

  const { data, error } = await supabase.from('tables').select('*').eq('id', id).maybeSingle();

  if (error) {
    console.error('getTable:', error.message);
    return null;
  }
  return (data as Table) ?? null;
}

export async function getCategories(restaurant_id: string): Promise<MenuCategory[]> {
  if (!supabase || isDemoRestaurant(restaurant_id)) {
    if (!supabase) return MOCK_CATEGORIES;
    const { data, error } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('restaurant_id', restaurant_id)
      .order('sort_order');
    if (error || !data?.length) return MOCK_CATEGORIES;
    return data as MenuCategory[];
  }

  const { data, error } = await supabase
    .from('menu_categories')
    .select('*')
    .eq('restaurant_id', restaurant_id)
    .order('sort_order');

  if (error || !data) return [];
  return data as MenuCategory[];
}

export async function getMenuItems(restaurant_id: string): Promise<MenuItem[]> {
  if (!supabase || isDemoRestaurant(restaurant_id)) {
    if (!supabase) return MOCK_MENU_ITEMS;
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', restaurant_id)
      .order('sort_order');
    if (error || !data?.length) return MOCK_MENU_ITEMS;
    return data as MenuItem[];
  }

  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('restaurant_id', restaurant_id)
    .order('sort_order');

  if (error || !data) return [];
  return data as MenuItem[];
}

// ==========================================
// 2. Orders & Mutations
// ==========================================

export async function createOrder(
  restaurant_id: string,
  table_id: string,
  total_amount: number,
  payment_method: 'upi' | 'card' | 'cash',
  items: { menu_item_id: string; quantity: number; subtotal: number }[]
) {
  if (!supabase) {
    return { id: 'mock_order_' + Math.random().toString(36).substring(7) };
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      restaurant_id,
      table_id,
      total_amount,
      payment_method,
      status: 'pending',
      is_paid: payment_method !== 'cash'
    })
    .select('id')
    .single();

  if (orderError || !order) {
    console.error('Order creation failed:', orderError);
    throw new Error('Failed to create order');
  }

  const orderItems = items.map((item) => ({
    order_id: order.id,
    ...item
  }));

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

  if (itemsError) {
    console.error('Order items creation failed:', itemsError);
  }

  return order;
}
