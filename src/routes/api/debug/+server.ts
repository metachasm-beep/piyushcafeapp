import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

const getSupabaseAdmin = () => {
	return createClient(publicEnv.PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
};

export async function GET({ url }) {
	try {
		const tableName = url.searchParams.get('table') || 'restaurants';
		
		const supabase = getSupabaseAdmin();
		
		const { data, error } = await supabase
			.from(tableName)
			.select('*')
			.limit(1);
			
		return json({
			table: tableName,
			data,
			error
		});
	} catch (e: any) {
		return json({ error: e.toString() });
	}
}
