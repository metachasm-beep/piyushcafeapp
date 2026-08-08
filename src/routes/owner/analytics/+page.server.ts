import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { supabase } from '$lib/supabase';

export const load: PageServerLoad = async ({ locals }) => {
  const { user, userRole, restaurantId } = locals;
  
  if (!user || userRole !== 'owner') {
    throw error(403, 'Unauthorized');
  }

  if (!restaurantId) {
    throw error(400, 'No restaurant ID');
  }

  if (!supabase) return { orders: [], feedback: [], menuItems: [] };

  // Fetch orders with items
  const { data: ordersData, error: ordersError } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('restaurant_id', restaurantId);

  // Fetch feedback
  const { data: feedbackData, error: feedbackError } = await supabase
    .from('customer_feedback')
    .select('*')
    .eq('restaurant_id', restaurantId);

  // Fetch menu items for reference
  const { data: menuData, error: menuError } = await supabase
    .from('menu_items')
    .select('id, name, price')
    .eq('restaurant_id', restaurantId);

  if (ordersError || feedbackError || menuError) {
    console.error('Analytics load error:', ordersError || feedbackError || menuError);
    throw error(500, 'Failed to load analytics data');
  }

  return {
    orders: ordersData ?? [],
    feedback: feedbackData ?? [],
    menuItems: menuData ?? []
  };
};
