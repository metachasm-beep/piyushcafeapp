import type { PageLoad } from './$types';
import { MOCK_RESTAURANT, MOCK_TABLES } from '$lib/mock-data';
import { getCategories, getMenuItems } from '$lib/sheets';
import { error } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { adminSettings } from '$lib/stores/admin';

export const load: PageLoad = async ({ params }) => {
  const restaurant = MOCK_RESTAURANT;
  const table = MOCK_TABLES.find(t => t.id === params.table_id) ?? MOCK_TABLES[0];
  
  try {
    const settings = get(adminSettings);
    if (!settings.spreadsheetId) {
      // Fallback or show empty if not configured
      return { restaurant, table, categories: [], menuItems: [], error: 'Google Sheets not configured. Ask admin to set Spreadsheet URL.' };
    }

    const allCategories = await getCategories();
    const categories = allCategories.filter(c => c.is_active);
    const menuItems = await getMenuItems();
    
    return { restaurant, table, categories, menuItems };
  } catch (err: any) {
    console.error('Failed to load menu from sheets:', err);
    return { restaurant, table, categories: [], menuItems: [], error: err.message };
  }
};
