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

			// Superadmin explicit check
			if (user.email.toLowerCase() === 'metachasm@gmail.com') {
				throw redirect(303, '/superadmin');
			}

			// For everyone else, check if they are an approved owner
			const { data: profile } = await supabase
				.from('owner_profiles')
				.select('is_approved')
				.eq('id', user.id)
				.single();

			if (profile && profile.is_approved) {
				throw redirect(303, '/owner');
			} else {
				// Not approved or not found in owner_profiles
				await supabase.auth.signOut();
				throw redirect(303, '/?error=pending_approval');
			}
		}
		console.error("Auth callback error:", error?.message);
	}

	// return the user to an error page with instructions
	throw redirect(303, '/?error=auth_callback_failed');
};
