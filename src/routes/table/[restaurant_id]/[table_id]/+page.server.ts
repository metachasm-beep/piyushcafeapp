import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
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

export const load: PageServerLoad = async ({ params }) => {
  const supabaseAdmin = getSupabaseAdmin();
  
  // Fetch Restaurant
  const { data: restaurant } = await supabaseAdmin
    .from('restaurants')
    .select('*')
    .eq('id', params.restaurant_id)
    .single();

  // Fetch Table
  const { data: table } = await supabaseAdmin
    .from('tables')
    .select('*')
    .eq('id', params.table_id)
    .single();

  if (!restaurant || !table) {
    throw error(404, 'Restaurant or table not found');
  }

  // Fetch Categories
  const { data: allCategories } = await supabaseAdmin
    .from('menu_categories')
    .select('*')
    .eq('restaurant_id', params.restaurant_id)
    .order('sort_order');
    
  const categories = (allCategories || []).filter(c => c.is_active);

  // Fetch Menu Items
  const { data: menuItems } = await supabaseAdmin
    .from('menu_items')
    .select('*')
    .eq('restaurant_id', params.restaurant_id)
    .order('sort_order');

  const menuItemIds = (menuItems || []).map(i => i.id);

  // Fetch Variations
  const { data: variations } = menuItemIds.length > 0 
    ? await supabaseAdmin.from('menu_item_variations').select('*').in('menu_item_id', menuItemIds).order('sort_order')
    : { data: [] };

  // Fetch Addons
  const { data: addons } = menuItemIds.length > 0
    ? await supabaseAdmin.from('menu_item_addons').select('*').in('menu_item_id', menuItemIds).order('sort_order')
    : { data: [] };

  return { 
    restaurant, 
    table, 
    categories, 
    menuItems: menuItems || [], 
    variations: variations || [], 
    addons: addons || [] 
  };
};
