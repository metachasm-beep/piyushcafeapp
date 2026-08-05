/**
 * menu.service.ts
 * Service layer for all menu-related database operations.
 * Uses Supabase as the backend; gracefully falls back to mock data.
 * Applies: backend-architect, database-optimizer, postgres-best-practices
 */
import { supabase } from "$lib/supabase";
import { MOCK_MENU_ITEMS, MOCK_CATEGORIES } from "$lib/mock-data";
import type { MenuItem, MenuCategory } from "$lib/types";
import { sanitizeObject, type MenuItemInput } from "$lib/server/security";

// =============================================
// READS
// =============================================

export async function fetchMenuItems(restaurantId: string): Promise<MenuItem[]> {
	if (!supabase) {
		console.log(JSON.stringify({ level: "warn", msg: "Supabase not configured. Using mock menu items." }));
		return MOCK_MENU_ITEMS;
	}

	const { data, error } = await supabase
		.from("menu_items")
		.select("*")
		.eq("restaurant_id", restaurantId)
		// Leverages composite index: idx_menu_items_restaurant_sort
		.order("sort_order", { ascending: true });

	if (error) {
		console.error(JSON.stringify({ level: "error", context: "fetchMenuItems", msg: error.message, restaurantId }));
		throw new Error("Failed to fetch menu items.");
	}
	return (data as MenuItem[]) ?? [];
}

export async function fetchCategories(restaurantId: string): Promise<MenuCategory[]> {
	if (!supabase) return MOCK_CATEGORIES;

	const { data, error } = await supabase
		.from("menu_categories")
		.select("*")
		.eq("restaurant_id", restaurantId)
		.order("sort_order", { ascending: true });

	if (error) {
		console.error(JSON.stringify({ level: "error", context: "fetchCategories", msg: error.message }));
		throw new Error("Failed to fetch categories.");
	}
	return (data as MenuCategory[]) ?? [];
}

// =============================================
// MUTATIONS (write operations � server-only)
// =============================================

export async function createMenuItem(input: MenuItemInput): Promise<MenuItem> {
	const sanitized = sanitizeObject(input);

	if (!supabase) {
		// Mock mode: return a fake item with generated ID
		return {
			id: crypto.randomUUID(),
			...sanitized,
			is_available: true,
			sort_order: 0,
			happy_hour_discount: sanitized.happy_hour_discount ?? 0
		} as unknown as MenuItem;
	}

	const { data, error } = await supabase
		.from("menu_items")
		.insert({ ...sanitized, is_available: true })
		.select()
		.single();

	if (error) {
		console.error(JSON.stringify({ level: "error", context: "createMenuItem", msg: error.message }));
		throw new Error("Failed to create menu item.");
	}
	return data as MenuItem;
}

export async function updateMenuItem(id: string, input: Partial<MenuItemInput>): Promise<MenuItem> {
	const sanitized = sanitizeObject(input as Record<string, unknown>) as Partial<MenuItemInput>;

	if (!supabase) {
		return { id, ...sanitized } as unknown as MenuItem;
	}

	const { data, error } = await supabase
		.from("menu_items")
		.update(sanitized)
		.eq("id", id)
		.select()
		.single();

	if (error) {
		console.error(JSON.stringify({ level: "error", context: "updateMenuItem", msg: error.message, id }));
		throw new Error("Failed to update menu item.");
	}
	return data as MenuItem;
}

export async function deleteMenuItem(id: string): Promise<void> {
	if (!supabase) return;

	const { error } = await supabase.from("menu_items").delete().eq("id", id);

	if (error) {
		console.error(JSON.stringify({ level: "error", context: "deleteMenuItem", msg: error.message, id }));
		throw new Error("Failed to delete menu item.");
	}
}

export async function toggleMenuItemAvailability(id: string, is_available: boolean): Promise<void> {
	if (!supabase) return;

	const { error } = await supabase
		.from("menu_items")
		.update({ is_available })
		.eq("id", id);

	if (error) {
		console.error(JSON.stringify({ level: "error", context: "toggleAvailability", msg: error.message, id }));
		throw new Error("Failed to toggle availability.");
	}
}
