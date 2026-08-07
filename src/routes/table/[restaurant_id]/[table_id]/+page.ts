import type { PageLoad } from './$types';
import { getRestaurant, getTable, getCategories, getMenuItems, getMenuItemVariations, getMenuItemAddons } from '$lib/db';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ params }) => {
  const restaurant = await getRestaurant(params.restaurant_id);
  const table = await getTable(params.table_id);
  
  if (!restaurant || !table) {
    throw error(404, 'Restaurant or table not found');
  }

  const allCategories = await getCategories(params.restaurant_id);
  const categories = allCategories.filter(c => c.is_active);
  const menuItems = await getMenuItems(params.restaurant_id);
  const menuItemIds = menuItems.map(i => i.id);
  const variations = await getMenuItemVariations(menuItemIds);
  const addons = await getMenuItemAddons(menuItemIds);
  
  return { restaurant, table, categories, menuItems, variations, addons };
};
