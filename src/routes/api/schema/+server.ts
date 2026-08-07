import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env as publicEnv } from '$env/dynamic/public';

export const GET: RequestHandler = async () => {
	const supabaseUrl = publicEnv.PUBLIC_SUPABASE_URL;
	const anonKey = publicEnv.PUBLIC_SUPABASE_ANON_KEY;

	if (!supabaseUrl || !anonKey) {
		return json({ error: 'Missing Supabase credentials' });
	}

	try {
		const res = await fetch(`${supabaseUrl}/rest/v1/?apikey=${anonKey}`);
		const data = await res.json();
		return json(data);
	} catch (e: any) {
		return json({ error: e.message });
	}
};
