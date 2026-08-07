import { supabase } from './supabase';
import type { Restaurant, Table, MenuCategory, MenuItem } from './types';

// ==========================================
// 1. Fetching Data
// ==========================================

export async function getRestaurant(id: string): Promise<Restaurant | null> {
  if (!supabase) return null;
  
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error || !data) return null;
  return data as Restaurant;
}

export async function getTable(id: string): Promise<Table | null> {
  if (!supabase) return null;
  
  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error || !data) return null;
  return data as Table;
}

export async function getCategories(restaurant_id: string): Promise<MenuCategory[]> {
  if (!supabase) return [];
  
  const { data, error } = await supabase
    .from('menu_categories')
    .select('*')
    .eq('restaurant_id', restaurant_id)
    .order('sort_order');
    
  if (error || !data) return [];
  return data as MenuCategory[];
}

export async function getMenuItems(restaurant_id: string): Promise<MenuItem[]> {
  if (!supabase) return [];
  
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('restaurant_id', restaurant_id)
    .order('sort_order');
    
  if (error || !data) return [];
  return data as MenuItem[];
}

export async function getMenuItemVariations(menu_item_ids: string[]) {
  if (!supabase || menu_item_ids.length === 0) return [];
  
  const { data, error } = await supabase
    .from('menu_item_variations')
    .select('*')
    .in('menu_item_id', menu_item_ids)
    .order('sort_order');
    
  if (error || !data) return [];
  return data;
}

export async function getMenuItemAddons(menu_item_ids: string[]) {
  if (!supabase || menu_item_ids.length === 0) return [];
  
  const { data, error } = await supabase
    .from('menu_item_addons')
    .select('*')
    .in('menu_item_id', menu_item_ids)
    .order('sort_order');
    
  if (error || !data) return [];
  return data;
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
    throw new Error('Supabase not initialized');
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
