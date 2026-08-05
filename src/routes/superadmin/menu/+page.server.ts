/**
 * superadmin/menu/+page.server.ts
 * Secure Form Actions for Menu CRUD.
 * Applies: api-design-principles, api-security-best-practices, backend-security-coder
 */
import type { Actions, PageServerLoad } from "./$types";
import { fail } from "@sveltejs/kit";
import { MenuItemSchema } from "$lib/server/security";
import {
	fetchMenuItems,
	fetchCategories,
	createMenuItem,
	updateMenuItem,
	deleteMenuItem,
	toggleMenuItemAvailability
} from "$lib/server/services/menu.service";
import { supabase } from "$lib/supabase";

export const load: PageServerLoad = async () => {
	// Pre-load restaurants list for the selector
	if (!supabase) {
		return { restaurants: [], categories: [], menuItems: [] };
	}
	const { data: restaurants } = await supabase
		.from("restaurants")
		.select("id, name")
		.order("name");
	return { restaurants: restaurants ?? [] };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const formData = await request.formData();
		const raw = Object.fromEntries(formData);

		const parsed = MenuItemSchema.safeParse({
			...raw,
			dietary_tags: formData.getAll("dietary_tags")
		});

		if (!parsed.success) {
			return fail(422, {
				action: "create",
				errors: parsed.error.flatten().fieldErrors,
				data: raw
			});
		}

		try {
			const item = await createMenuItem(parsed.data);
			return { success: true, action: "create", item };
		} catch (e) {
			return fail(500, { action: "create", error: (e as Error).message });
		}
	},

	update: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get("id") as string;
		if (!id) return fail(400, { action: "update", error: "Missing item ID" });

		const raw = Object.fromEntries(formData);
		const parsed = MenuItemSchema.partial().safeParse({
			...raw,
			dietary_tags: formData.getAll("dietary_tags")
		});

		if (!parsed.success) {
			return fail(422, {
				action: "update",
				errors: parsed.error.flatten().fieldErrors,
				data: raw
			});
		}

		try {
			const item = await updateMenuItem(id, parsed.data);
			return { success: true, action: "update", item };
		} catch (e) {
			return fail(500, { action: "update", error: (e as Error).message });
		}
	},

	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get("id") as string;
		if (!id) return fail(400, { action: "delete", error: "Missing item ID" });

		try {
			await deleteMenuItem(id);
			return { success: true, action: "delete", id };
		} catch (e) {
			return fail(500, { action: "delete", error: (e as Error).message });
		}
	},

	toggle: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get("id") as string;
		const is_available = formData.get("is_available") === "true";
		if (!id) return fail(400, { action: "toggle", error: "Missing item ID" });

		try {
			await toggleMenuItemAvailability(id, is_available);
			return { success: true, action: "toggle", id, is_available };
		} catch (e) {
			return fail(500, { action: "toggle", error: (e as Error).message });
		}
	}
};
