import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	const { session, user } = await safeGetSession();

	if (session && user) {
		const SUPERADMIN_EMAIL = 'metachasm@gmail.com';

		if (user.email && user.email.toLowerCase() === SUPERADMIN_EMAIL) {
			throw redirect(303, '/superadmin');
		}

		// Check if they are an approved owner
		const { data: profile } = await supabase
			.from('owner_profiles')
			.select('is_approved')
			.eq('id', user.id)
			.single();

		if (profile && profile.is_approved) {
			throw redirect(303, '/owner');
		} else {
			// If they have a session but are not approved, sign them out
			await supabase.auth.signOut();
			throw redirect(303, '/?error=pending_approval');
		}
	}

	return {};
};
