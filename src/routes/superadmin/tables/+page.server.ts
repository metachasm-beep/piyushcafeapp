/**
 * superadmin/tables/+page.server.ts
 */
import type { Actions, PageServerLoad } from "./$types";
import { fail } from "@sveltejs/kit";
import { TableSchema } from "$lib/server/security";
import {
	provisionTable,
	updateTableStatus,
	updateTable,
	fetchTables
} from "$lib/server/services/table.service";
import { supabase } from "$lib/supabase";
import { MOCK_RESTAURANT, MOCK_TABLES } from "$lib/mock-data";
import { z } from "zod";

export const load: PageServerLoad = async ({ url }) => {
	const restaurants = supabase
		? (
				await supabase.from("restaurants").select("id, name").order("name")
			).data ?? [{ id: MOCK_RESTAURANT.id, name: MOCK_RESTAURANT.name }]
		: [{ id: MOCK_RESTAURANT.id, name: MOCK_RESTAURANT.name }];

	const restaurantId = url.searchParams.get("restaurant") || restaurants[0]?.id || MOCK_RESTAURANT.id;

	try {
		const tables = await fetchTables(restaurantId);
		return {
			restaurants,
			restaurantId,
			tables,
			loadError: null as string | null
		};
	} catch (e) {
		return {
			restaurants,
			restaurantId,
			tables: MOCK_TABLES,
			loadError: (e as Error).message
		};
	}
};

export const actions: Actions = {
	provision: async ({ request }) => {
		const formData = await request.formData();
		const raw = Object.fromEntries(formData);

		const parsed = TableSchema.safeParse(raw);
		if (!parsed.success) {
			return fail(422, {
				action: "provision",
				errors: parsed.error.flatten().fieldErrors,
				error: Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? "Validation failed",
				data: raw
			});
		}

		try {
			const table = await provisionTable(parsed.data);
			return { success: true, action: "provision", table };
		} catch (e) {
			return fail(500, { action: "provision", error: (e as Error).message });
		}
	},

	toggleStatus: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get("id") as string;
		const is_active = formData.get("is_active") === "true";
		if (!id) return fail(400, { action: "toggleStatus", error: "Missing table ID" });

		try {
			await updateTableStatus(id, is_active);
			return { success: true, action: "toggleStatus", id, is_active };
		} catch (e) {
			return fail(500, { action: "toggleStatus", error: (e as Error).message });
		}
	},

	update: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get("id") as string;
		if (!id) return fail(400, { action: "update", error: "Missing table ID" });

		const parsed = z
			.object({
				display_name: z.string().min(1).max(60).optional(),
				capacity: z.coerce.number().int().min(1).max(50).optional(),
				table_number: z.coerce.number().int().positive().optional()
			})
			.safeParse(Object.fromEntries(formData));

		if (!parsed.success) {
			return fail(422, {
				action: "update",
				error: Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? "Validation failed"
			});
		}

		try {
			const table = await updateTable(id, parsed.data);
			return { success: true, action: "update", table };
		} catch (e) {
			return fail(500, { action: "update", error: (e as Error).message });
		}
	}
};
