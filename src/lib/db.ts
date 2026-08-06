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
  items: { menu_item_id: string, quantity: number }[]
) {
  if (!supabase) {
    // In mock mode, we just return a fake ID and don't actually hit a DB
    return { id: 'mock_order_' + Math.random().toString(36).substring(7) };
  }

  // Call the atomic RPC to place the order
  const { data: orderId, error } = await supabase.rpc("place_order", {
    p_restaurant_id: restaurant_id,
    p_table_id: table_id,
    p_special_instructions: "",
    p_items: items.map(item => ({
      menu_item_id: item.menu_item_id,
      quantity: item.quantity
    }))
  });

  if (error || !orderId) {
    console.error('Order creation failed:', error);
    throw new Error('Failed to create order');
  }

  // Handle the payment_method setting separately if required by the frontend 
  // since the RPC just defaults to 'pending' and 'unpaid'
  const { error: updateError } = await supabase
    .from('orders')
    .update({ 
      payment_method, 
      payment_status: payment_method !== 'cash' ? 'paid' : 'unpaid'
    })
    .eq('id', orderId);

  if (updateError) {
    console.error('Failed to update payment details:', updateError);
  }

  return { id: orderId };
}
