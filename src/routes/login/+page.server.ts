import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	const { session, user } = await safeGetSession();

	if (session && user) {
		const SUPERADMIN_EMAIL = 'metachasm@gmail.com';

		if (user.email && user.email.toLowerCase() === SUPERADMIN_EMAIL) {
			throw redirect(303, '/superadmin');
		}

		const { data: staffData } = await supabase
			.from('restaurant_staff')
			.select('role')
			.eq('user_id', user.id)
			.single();

		if (staffData) {
			if (staffData.role === 'chef') throw redirect(303, '/owner/kitchen');
			if (staffData.role === 'waiter') throw redirect(303, '/owner/waiter');
			throw redirect(303, '/owner');
		}

		const { data: profile } = await supabase
			.from('owner_profiles')
			.select('is_approved')
			.eq('id', user.id)
			.single();

		if (profile && profile.is_approved) {
			throw redirect(303, '/owner');
		} else {
			await supabase.auth.signOut();
			throw redirect(303, '/login?error=pending_approval');
		}
	}

	return {};
};
