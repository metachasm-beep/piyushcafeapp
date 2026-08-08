import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { createClient } from '@supabase/supabase-js';

const getSupabaseAdmin = () => {
	const supabaseUrl = publicEnv.PUBLIC_SUPABASE_URL;
	const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
	if (!supabaseUrl || !supabaseKey) {
		throw new Error('Supabase admin credentials missing');
	}
	return createClient(supabaseUrl, supabaseKey);
};

export const actions: Actions = {
	addTable: async ({ request, locals }) => {
		const { session, userRole, restaurantId } = locals;
		
		if (!session || userRole !== 'owner' || !restaurantId) {
			return fail(401, { error: 'Unauthorized. You must be an owner to add tables.' });
		}

		const formData = await request.formData();
		const tableNumberStr = formData.get('table_number')?.toString();
		const displayName = formData.get('display_name')?.toString();

		if (!tableNumberStr) {
			return fail(400, { error: 'Table number is required' });
		}

		const supabaseAdmin = getSupabaseAdmin();
		const newTableId = crypto.randomUUID();

		const dbPayload = {
			id: newTableId,
			restaurant_id: restaurantId,
			table_number: tableNumberStr,
			display_name: displayName || null,
			is_active: true
		};

		const { error: dbError } = await supabaseAdmin
			.from('tables')
			.insert(dbPayload);

		if (dbError) {
			console.error('DB error adding table:', dbError);
			return fail(500, { error: 'Database Error: ' + dbError.message });
		}

		return { success: true, table: dbPayload };
	}
};
