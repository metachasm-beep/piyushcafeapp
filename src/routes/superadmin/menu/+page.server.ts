/**
 * superadmin/menu/+page.server.ts
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
import { MOCK_RESTAURANT, MOCK_CATEGORIES, MOCK_MENU_ITEMS } from "$lib/mock-data";

export const load: PageServerLoad = async ({ url }) => {
	const restaurants = supabase
		? (
				await supabase.from("restaurants").select("id, name").order("name")
			).data ?? [{ id: MOCK_RESTAURANT.id, name: MOCK_RESTAURANT.name }]
		: [{ id: MOCK_RESTAURANT.id, name: MOCK_RESTAURANT.name }];

	const restaurantId = url.searchParams.get("restaurant") || restaurants[0]?.id || MOCK_RESTAURANT.id;

	try {
		const [categories, menuItems] = await Promise.all([
			fetchCategories(restaurantId),
			fetchMenuItems(restaurantId)
		]);
		return {
			restaurants,
			restaurantId,
			categories,
			menuItems,
			loadError: null as string | null
		};
	} catch (e) {
		return {
			restaurants,
			restaurantId,
			categories: MOCK_CATEGORIES,
			menuItems: MOCK_MENU_ITEMS,
			loadError: (e as Error).message
		};
	}
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
				error: Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? "Validation failed",
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
				error: Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? "Validation failed",
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
