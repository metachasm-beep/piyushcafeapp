import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
	const code = url.searchParams.get('code');

	if (code) {
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			const { data: { user } } = await supabase.auth.getUser();
			
			if (!user || !user.email) {
				await supabase.auth.signOut();
				throw redirect(303, '/?error=unauthorized');
			}

			// 1. Superadmin check
			if (user.email.toLowerCase() === 'metachasm@gmail.com') {
				throw redirect(303, '/superadmin');
			}

			// 2. Check if they are restaurant staff (Waiter, Chef, Owner)
			const { data: staffData } = await supabase
				.from('restaurant_staff')
				.select('role')
				.eq('user_id', user.id)
				.single();

			if (staffData) {
				if (staffData.role === 'owner') {
					throw redirect(303, '/owner');
				} else if (staffData.role === 'chef') {
					throw redirect(303, '/owner/kitchen');
				} else if (staffData.role === 'waiter') {
					throw redirect(303, '/owner/waiter');
				}
				// Default staff fallback
				throw redirect(303, '/owner');
			}

			// 3. Fallback to legacy owner_profiles just in case
			const { data: profile } = await supabase
				.from('owner_profiles')
				.select('is_approved')
				.eq('id', user.id)
				.single();

			if (profile && profile.is_approved) {
				throw redirect(303, '/owner');
			}

			// 4. If not found in any authorized table, deny access
			await supabase.auth.signOut();
			throw redirect(303, '/?error=unauthorized');
		}
		console.error("Auth callback error:", error?.message);
	}

	// return the user to an error page with instructions
	throw redirect(303, '/?error=auth_callback_failed');
};
