import { supabase } from './supabase';
import { MOCK_RESTAURANT, MOCK_TABLES, MOCK_CATEGORIES, MOCK_MENU_ITEMS } from './mock-data';
import type { Restaurant, Table, MenuCategory, MenuItem } from './types';

// ==========================================
// 1. Fetching Data
// ==========================================

export async function getRestaurant(id: string): Promise<Restaurant | null> {
  if (!supabase) return MOCK_RESTAURANT;
  
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error || !data) return null;
  return data as Restaurant;
}

export async function getTable(id: string): Promise<Table | null> {
  if (!supabase) return MOCK_TABLES.find(t => t.id === id) || null;
  
  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error || !data) return null;
  return data as Table;
}

export async function getCategories(restaurant_id: string): Promise<MenuCategory[]> {
  if (!supabase) return MOCK_CATEGORIES;
  
  const { data, error } = await supabase
    .from('menu_categories')
    .select('*')
    .eq('restaurant_id', restaurant_id)
    .order('sort_order');
    
  if (error || !data) return [];
  return data as MenuCategory[];
}

export async function getMenuItems(restaurant_id: string): Promise<MenuItem[]> {
  if (!supabase) return MOCK_MENU_ITEMS;
  
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
  items: { menu_item_id: string, quantity: number, subtotal: number }[]
) {
  if (!supabase) {
    // In mock mode, we just return a fake ID and don't actually hit a DB
    return { id: 'mock_order_' + Math.random().toString(36).substring(7) };
  }

  // 1. Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      restaurant_id,
      table_id,
      total_amount,
      payment_method,
      status: 'pending',
      is_paid: payment_method !== 'cash' // Cash is unpaid initially
    })
    .select('id')
    .single();

  if (orderError || !order) {
    console.error('Order creation failed:', orderError);
    throw new Error('Failed to create order');
  }

  // 2. Insert items
  const orderItems = items.map(item => ({
    order_id: order.id,
    ...item
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) {
    console.error('Order items creation failed:', itemsError);
    // Ideally we should rollback or have an RPC, but this is fine for now
  }

  return order;
}
