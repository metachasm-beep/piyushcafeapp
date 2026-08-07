import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	const { session, user } = await safeGetSession();

	if (!session || !user) {
		throw redirect(303, '/');
	}

	// Check if already approved or already has restaurant_name
	const { data: profile } = await supabase
		.from('owner_profiles')
		.select('is_approved, restaurant_name')
		.eq('id', user.id)
		.single();

	if (profile?.is_approved) {
		throw redirect(303, '/owner');
	}

	if (profile?.restaurant_name) {
		throw redirect(303, '/?error=pending_approval');
	}

	return {};
};

export const actions: Actions = {
	default: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { session, user } = await safeGetSession();

		if (!session || !user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const restaurant_name = formData.get('restaurant_name') as string;

		if (!restaurant_name || restaurant_name.trim().length < 2) {
			return fail(400, { error: 'Restaurant name must be at least 2 characters long' });
		}

		const { error } = await supabase
			.from('owner_profiles')
			.update({ restaurant_name: restaurant_name.trim() })
			.eq('id', user.id);

		if (error) {
			console.error('Error saving restaurant name:', error);
			return fail(500, { error: 'Failed to save restaurant name' });
		}

		throw redirect(303, '/?error=pending_approval');
	}
};
