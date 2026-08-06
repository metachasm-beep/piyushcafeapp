import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ url, locals: { supabase } }) => {
	await supabase.auth.signOut();
	const next = url.searchParams.get('next') ?? '/superadmin/login';
	throw redirect(303, next);
};
