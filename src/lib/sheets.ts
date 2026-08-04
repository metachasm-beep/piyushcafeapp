import Papa from 'papaparse';
import type { MenuItem, MenuCategory } from '$lib/types';
import { get } from 'svelte/store';
import { adminSettings } from '$lib/stores/admin';
import { generateUUID } from '$lib/utils';

// Helper to convert Google Drive share links to direct image links
function convertDriveLink(url: string): string {
  if (!url) return '';
  if (url.includes('drive.google.com/file/d/')) {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?id=${match[1]}`;
    }
  }
  return url;
}

/**
 * Fetch a specific sheet from the Google Spreadsheet as CSV and parse it.
 */
export async function fetchSheetData<T>(sheetName: string, customSpreadsheetId?: string): Promise<T[]> {
  const settings = get(adminSettings);
  const spreadsheetId = customSpreadsheetId || settings.spreadsheetId;
  
  if (!spreadsheetId) {
    throw new Error('Google Spreadsheet ID is not configured.');
  }

  const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;
  
  try {
    const response = await fetch(csvUrl);
    if (!response.ok) throw new Error(`Failed to fetch ${sheetName} sheet`);
    
    const csvText = await response.text();
    
    // Check if it returned HTML (usually means the sheet is not public or invalid)
    if (csvText.trim().startsWith('<html') || csvText.trim().startsWith('<!DOCTYPE html>')) {
      throw new Error('Received HTML instead of CSV. Ensure the Google Sheet is set to "Anyone with the link can view".');
    }

    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true, // Automatically converts numbers/booleans
        complete: (results) => {
          resolve(results.data as T[]);
        },
        error: (error: any) => {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error(`Error fetching sheet ${sheetName}:`, error);
    throw error;
  }
}

/**
 * Fetch and format Menu Items
 */
export async function getMenuItems(customSpreadsheetId?: string): Promise<MenuItem[]> {
  const rawData = await fetchSheetData<any>('Menu', customSpreadsheetId);
  
  return rawData.map(row => ({
    id: String(row.id || generateUUID()),
    restaurant_id: 'res_1', // Hardcoded for single-tenant
    category_id: String(row.category_id || ''),
    name: String(row.name || ''),
    description: row.description ? String(row.description) : null,
    price: Number(row.price || 0),
    image_url: convertDriveLink(String(row.image_url || '')) || null,
    preparation_time: row.preparation_time ? Number(row.preparation_time) : null,
    dietary_tags: row.dietary_tags ? String(row.dietary_tags).split(',').map(s => s.trim() as any) : [],
    is_available: row.is_available === true || row.is_available === 'TRUE',
    is_featured: row.is_featured === true || row.is_featured === 'TRUE',
    sort_order: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
}

/**
 * Fetch and format Categories
 */
export async function getCategories(customSpreadsheetId?: string): Promise<MenuCategory[]> {
  const rawData = await fetchSheetData<any>('Categories', customSpreadsheetId);
  
  return rawData.map(row => ({
    id: String(row.id || generateUUID()),
    restaurant_id: 'res_1', // Hardcoded for single-tenant PWA
    name: String(row.name || ''),
    description: null,
    icon_emoji: String(row.icon || row.icon_emoji || '🍽️'),
    sort_order: Number(row.sort_order || 0),
    is_active: row.is_active === true || row.is_active === 'TRUE',
    created_at: new Date().toISOString()
  }));
}

/**
 * Write operations using Google Apps Script Webhook
 */
async function sendWebhookCommand(payload: any) {
  const settings = get(adminSettings);
  if (!settings.googleAppsScriptUrl) {
    throw new Error('Google Apps Script Webhook URL is not configured.');
  }

  // Uses no-cors if standard cors fails, but standard POST usually works with Web Apps.
  const response = await fetch(settings.googleAppsScriptUrl, {
    method: 'POST',
    body: JSON.stringify(payload)
    // Avoid setting headers like Content-Type to application/json if CORS preflight fails.
    // Apps script handles text/plain automatically via e.postData.contents
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Webhook command failed');
  }
  return result;
}

export async function addMenuItemToSheet(item: MenuItem) {
  return sendWebhookCommand({
    action: 'ADD_MENU_ITEM',
    item
  });
}

export async function deleteMenuItemFromSheet(id: string) {
  return sendWebhookCommand({
    action: 'DELETE_MENU_ITEM',
    id
  });
}

export async function toggleMenuItemAvailabilityInSheet(id: string, is_available: boolean) {
  return sendWebhookCommand({
    action: 'TOGGLE_AVAILABILITY',
    id,
    is_available
  });
}
