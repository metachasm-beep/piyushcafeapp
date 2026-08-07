/**
 * table.service.ts
 * Service layer for table/QR endpoint management.
 * Applies: database-architect, postgres-best-practices
 */
import type { Table } from "$lib/types";
import { sanitizeObject, type TableInput } from "$lib/server/security";
import type { SupabaseClient } from '@supabase/supabase-js';

export async function fetchTables(supabase: SupabaseClient, restaurantId: string): Promise<Table[]> {
	const { data, error } = await supabase
		.from("tables")
		.select("*")
		.eq("restaurant_id", restaurantId)
		.order("table_number", { ascending: true });

	if (error) {
		console.error(JSON.stringify({ level: "error", context: "fetchTables", msg: error.message }));
		throw new Error("Failed to fetch tables.");
	}
	return (data as Table[]) ?? [];
}

export async function provisionTable(supabaseAdmin: SupabaseClient, input: TableInput): Promise<Table> {
	const sanitized: any = sanitizeObject(input);
	
	// The 'capacity' column does not exist in the actual database schema,
	// so we must remove it from the payload to avoid schema cache errors.
	delete sanitized.capacity;

	const { data, error } = await supabaseAdmin
		.from("tables")
		.insert({ ...sanitized, is_active: true })
		.select()
		.single();

	if (error) {
		// Unique constraint violation for table_number
		if (error.code === "23505") {
			throw new Error(`Table number ${input.table_number} already exists for this restaurant.`);
		}
		console.error(JSON.stringify({ level: "error", context: "provisionTable", msg: error.message, details: error.details, hint: error.hint }));
		throw new Error(`Failed to provision table: ${error.message}`);
	}
	return data as Table;
}

export async function updateTableStatus(supabaseAdmin: SupabaseClient, id: string, is_active: boolean): Promise<void> {
	const { error } = await supabaseAdmin.from("tables").update({ is_active }).eq("id", id);

	if (error) {
		console.error(JSON.stringify({ level: "error", context: "updateTableStatus", msg: error.message, id }));
		throw new Error("Failed to update table status.");
	}
}

export async function deleteTable(supabaseAdmin: SupabaseClient, id: string): Promise<void> {
	const { error } = await supabaseAdmin.from("tables").delete().eq("id", id);

	if (error) {
		console.error(JSON.stringify({ level: "error", context: "deleteTable", msg: error.message, id }));
		throw new Error("Failed to delete table.");
	}
}
