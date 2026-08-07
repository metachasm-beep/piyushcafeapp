import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';
import { assignAvailableWaiter } from '$lib/server/services/staff.service';
import { env as publicEnv } from '$env/dynamic/public';
import { env } from '$env/dynamic/private';
import { createClient } from '@supabase/supabase-js';

const getSupabaseAdmin = () => {
	const supabaseUrl = publicEnv.PUBLIC_SUPABASE_URL;
	const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
	if (!supabaseUrl || !supabaseKey) {
		throw new Error('Supabase admin credentials missing');
	}
	return createClient(supabaseUrl, supabaseKey);
};

export async function POST({ request }) {
	try {
		const { restaurant_id, table_id, order_id } = await request.json();

		if (!restaurant_id || !table_id) {
			return json({ success: false, message: 'Missing parameters' }, { status: 400 });
		}

		if (!supabase) {
			return json({ success: false, message: 'Database not initialized' }, { status: 500 });
		}

		const { data: requestRecord, error } = await supabase
			.from('waiter_requests')
			.insert({
				restaurant_id,
				table_id,
				order_id: order_id || null,
				status: 'pending'
			})
			.select('id')
			.single();

		if (error || !requestRecord) {
			console.error('Error creating waiter request:', error);
			return json({ success: false, message: 'Failed to request waiter' }, { status: 500 });
		}

		// Automatically assign an available waiter
		try {
			const admin = getSupabaseAdmin();
			await assignAvailableWaiter(admin, restaurant_id, requestRecord.id, 'waiter_request');
		} catch (e) {
			console.error('Failed to assign waiter:', e);
		}

		return json({ success: true, id: requestRecord.id });
	} catch (err) {
		console.error('Waiter call error:', err);
		return json({ success: false, message: 'Internal server error' }, { status: 500 });
	}
}
