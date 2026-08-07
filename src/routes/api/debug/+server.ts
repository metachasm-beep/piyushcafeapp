import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

export const GET: RequestHandler = async () => {
	try {
		const supabaseUrl = publicEnv.PUBLIC_SUPABASE_URL;
		const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
		const supabase = createClient(supabaseUrl, supabaseKey);
		
		// Query information_schema
		const { data: schemaData, error: schemaError } = await supabase
			.from('information_schema.key_column_usage')
			.select('*')
			.eq('table_name', 'restaurants');

		return json({ schemaData, schemaError });
	} catch (e: any) {
		return json({ error: e.toString() });
	}
};
