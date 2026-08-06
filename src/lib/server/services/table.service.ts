/**
 * table.service.ts
 * Service layer for table/QR endpoint management.
 * Applies: database-architect, postgres-best-practices
 */
import { supabase } from "$lib/supabase";
import { MOCK_TABLES } from "$lib/mock-data";
import type { Table } from "$lib/types";
import { sanitizeObject, type TableInput } from "$lib/server/security";

export async function fetchTables(restaurantId: string): Promise<Table[]> {
	if (!supabase) return MOCK_TABLES.filter((t) => t.restaurant_id === restaurantId || true);

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

export async function provisionTable(input: TableInput): Promise<Table> {
	const sanitized = sanitizeObject(input);

	if (!supabase) {
		return {
			id: crypto.randomUUID(),
			...sanitized,
			is_active: true
		} as unknown as Table;
	}

	const { data, error } = await supabase
		.from("tables")
		.insert({ ...sanitized, is_active: true })
		.select()
		.single();

	if (error) {
		// Unique constraint violation for table_number
		if (error.code === "23505") {
			throw new Error(`Table number ${input.table_number} already exists for this restaurant.`);
		}
		console.error(JSON.stringify({ level: "error", context: "provisionTable", msg: error.message }));
		throw new Error("Failed to provision table.");
	}
	return data as Table;
}

export async function updateTableStatus(id: string, is_active: boolean): Promise<void> {
	if (!supabase) return;

	const { error } = await supabase.from("tables").update({ is_active }).eq("id", id);

	if (error) {
		console.error(JSON.stringify({ level: "error", context: "updateTableStatus", msg: error.message, id }));
		throw new Error("Failed to update table status.");
	}
}
