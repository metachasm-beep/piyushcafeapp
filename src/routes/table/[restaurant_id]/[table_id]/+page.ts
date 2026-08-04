import type { PageLoad } from './$types';
import { MOCK_RESTAURANT, MOCK_TABLES, MOCK_CATEGORIES, MOCK_MENU_ITEMS } from '$lib/mock-data';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ params }) => {
  // In mock mode, ignore actual IDs and return the demo data
  const restaurant = MOCK_RESTAURANT;
  const table = MOCK_TABLES.find(t => t.id === params.table_id) ?? MOCK_TABLES[0];
  const categories = MOCK_CATEGORIES.filter(c => c.is_active);
  const menuItems = MOCK_MENU_ITEMS;
  
  return { restaurant, table, categories, menuItems };
};
