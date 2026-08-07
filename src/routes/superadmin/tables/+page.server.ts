/**
 * superadmin/tables/+page.server.ts
 * Secure Form Actions for Table/QR management.
 * Applies: api-security-best-practices, database-architect
 */
import type { Actions, PageServerLoad } from "./$types";
import { fail } from "@sveltejs/kit";
import { TableSchema } from "$lib/server/security";
import { provisionTable, updateTableStatus } from "$lib/server/services/table.service";
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

const getSupabaseAdmin = () => {
	const supabaseUrl = publicEnv.PUBLIC_SUPABASE_URL;
	const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
	if (!supabaseUrl || !supabaseKey) {
		throw new Error('Supabase admin credentials missing');
	}
	return createClient(supabaseUrl, supabaseKey);
};

export const load: PageServerLoad = async () => {
	const supabaseAdmin = getSupabaseAdmin();
	
	const [{ data: restaurants }, { data: tables }] = await Promise.all([
		supabaseAdmin.from('restaurants').select('*').order('created_at', { ascending: false }),
		supabaseAdmin.from('tables').select('*').order('table_number', { ascending: true })
	]);

	return {
		restaurants: restaurants || [],
		tables: tables || []
	};
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
				data: raw
			});
		}

		try {
			const supabaseAdmin = getSupabaseAdmin();
			const table = await provisionTable(supabaseAdmin, parsed.data);
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
			const supabaseAdmin = getSupabaseAdmin();
			await updateTableStatus(supabaseAdmin, id, is_active);
			return { success: true, action: "toggleStatus", id, is_active };
		} catch (e) {
			return fail(500, { action: "toggleStatus", error: (e as Error).message });
		}
	}
};
