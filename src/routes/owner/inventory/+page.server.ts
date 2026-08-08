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
	addCategory: async ({ request, locals }) => {
		const { session, userRole, restaurantId } = locals;
		
		if (!session || userRole !== 'owner' || !restaurantId) {
			return fail(401, { error: 'Unauthorized. You must be an owner.' });
		}

		const formData = await request.formData();
		const name = formData.get('name')?.toString();
		const sortOrderStr = formData.get('sort_order')?.toString();

		if (!name) {
			return fail(400, { error: 'Category name is required' });
		}

		const supabaseAdmin = getSupabaseAdmin();
		const newCat = {
			id: crypto.randomUUID(),
			restaurant_id: restaurantId,
			name: name.trim(),
			icon_emoji: '🍽️',
			sort_order: sortOrderStr ? parseInt(sortOrderStr, 10) : 0,
			is_active: true
		};

		const { error: dbError } = await supabaseAdmin
			.from('menu_categories')
			.insert(newCat);

		if (dbError) {
			console.error('DB error adding category:', dbError);
			return fail(500, { error: 'Database Error: ' + dbError.message });
		}

		return { success: true, category: newCat };
	}
};
