import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
	const code = url.searchParams.get('code');
	const next = url.searchParams.get('next') ?? '/';

	if (code) {
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			// Verify if the user is allowed to log into the system
			const { data: { user } } = await supabase.auth.getUser();
			const ALLOWED_EMAILS = ['metachasm@gmail.com', 'nit.uniyal@gmail.com'];
			
			if (!user || !user.email || !ALLOWED_EMAILS.includes(user.email.toLowerCase())) {
				// Instantly destroy the session for unauthorized users
				await supabase.auth.signOut();
				throw redirect(303, '/superadmin/login?error=unauthorized');
			}

			throw redirect(303, `/${next.slice(1)}`);
		}
		console.error("Auth callback error:", error.message);
	}

	// return the user to an error page with instructions
	throw redirect(303, '/superadmin/login?error=auth_callback_failed');
};
