/**
 * superadmin/tables/+page.server.ts
 * Secure Form Actions for Table/QR management.
 * Applies: api-security-best-practices, database-architect
 */
import type { Actions } from "./$types";
import { fail } from "@sveltejs/kit";
import { TableSchema } from "$lib/server/security";
import { provisionTable, updateTableStatus } from "$lib/server/services/table.service";

export const actions: Actions = {
	provision: async ({ request }) => {
		const formData = await request.formData();
		const raw = Object.fromEntries(formData);

		const parsed = TableSchema.safeParse(raw);
		if (!parsed.success) {
			return fail(422, {
				action: "provision",
				errors: parsed.error.flatten().fieldErrors,
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
	}
};
