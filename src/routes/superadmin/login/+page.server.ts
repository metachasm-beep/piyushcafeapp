import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { session, user } = await locals.safeGetSession();

	// If already logged in as superadmin, redirect to dashboard
	if (session && user?.email === 'metachasm@gmail.com') {
		throw redirect(303, '/superadmin');
	}

	// We allow them to view the login page if not metachasm, 
	// they just can't get past it.
	return {};
};
