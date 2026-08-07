import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	// Superadmin (who meets the email criteria) can read all from owner_profiles 
	// assuming the RLS policy is set up properly.
	const { data: profiles, error } = await supabase
		.from('owner_profiles')
		.select('*')
		.order('created_at', { ascending: false });

	if (error) {
		console.error('Error fetching owner profiles:', error);
	}

	return {
		profiles: profiles ?? []
	};
};

export const actions: Actions = {
	toggleApproval: async ({ request, locals: { supabase } }) => {
		const data = await request.formData();
		const id = data.get('id');
		const currentState = data.get('currentState') === 'true';

		if (id) {
			const { error } = await supabase
				.from('owner_profiles')
				.update({ is_approved: !currentState })
				.eq('id', id);

			if (error) {
				console.error('Error updating approval status:', error);
			}
		}

		return { success: true };
	}
};
