import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { createClient } from '@supabase/supabase-js';

const getSupabaseAdmin = () => {
	const supabaseUrl = publicEnv.PUBLIC_SUPABASE_URL;
	const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
	if (!supabaseUrl || !supabaseKey) {
		throw new Error('Supabase admin credentials missing');
	}
	return createClient(supabaseUrl, supabaseKey);
};

export const load: PageServerLoad = async ({ locals }) => {
  const { user, userRole, restaurantId } = locals;
  
  if (!user || userRole !== 'owner') {
    throw error(403, 'Unauthorized');
  }

  if (!restaurantId) {
    throw error(400, 'No restaurant ID');
  }

  const supabaseAdmin = getSupabaseAdmin();

  // Fetch orders with items
  const { data: ordersData, error: ordersError } = await supabaseAdmin
    .from('orders')
    .select('*, order_items(*)')
    .eq('restaurant_id', restaurantId);

  // Fetch menu items for reference
  const { data: menuData, error: menuError } = await supabaseAdmin
    .from('menu_items')
    .select('id, name, price')
    .eq('restaurant_id', restaurantId);

  if (ordersError || menuError) {
    console.error('Analytics load error:', ordersError || menuError);
    throw error(500, 'Failed to load analytics data');
  }

  return {
    orders: ordersData ?? [],
    feedback: [], // customer_feedback table does not exist
    menuItems: menuData ?? []
  };
};
