import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env as publicEnv } from '$env/dynamic/public';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async () => {
	const supabaseUrl = publicEnv.PUBLIC_SUPABASE_URL;
	const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

	if (!supabaseUrl || !serviceRoleKey) {
		return json({ error: 'Missing Supabase credentials' });
	}

	try {
		const res = await fetch(`${supabaseUrl}/rest/v1/`, {
			headers: {
				'apikey': serviceRoleKey,
				'Authorization': `Bearer ${serviceRoleKey}`
			}
		});
		const data = await res.json();
		return json(data);
	} catch (e: any) {
		return json({ error: e.message });
	}
};
