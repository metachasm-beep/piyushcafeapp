import type { LayoutServerLoad } from './$types';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { createClient } from '@supabase/supabase-js';

const getSupabaseAdmin = () => {
	const supabaseUrl = publicEnv.PUBLIC_SUPABASE_URL;
	const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
	if (!supabaseUrl || !supabaseKey) {
		throw new Error('Supabase admin credentials missing');
	}
	return createClient(supabaseUrl, supabaseKey);
};

export const load: LayoutServerLoad = async ({ locals }) => {
	const { supabase, user } = locals;
	if (!user) {
		return { restaurant: null };
	}

	const supabaseAdmin = getSupabaseAdmin();

	// Fetch the restaurant the owner belongs to
	const { data: staffData } = await supabaseAdmin
		.from('restaurant_staff')
		.select('restaurant_id')
		.eq('user_id', user.id)
		.limit(1)
		.single();

	let restaurantId = staffData?.restaurant_id;

	if (!restaurantId) {
		// Fallback for owners who might not be in the staff table
		const { data: ownedRestaurant } = await supabaseAdmin
			.from('restaurants')
			.select('id')
			.eq('owner_id', user.id)
			.limit(1)
			.single();
			
		if (ownedRestaurant) {
			restaurantId = ownedRestaurant.id;
		} else {
			return { restaurant: null };
		}
	}

	const { data: restaurant } = await supabaseAdmin
		.from('restaurants')
		.select('*')
		.eq('id', restaurantId)
		.limit(1)
		.single();

	const { data: tables } = await supabaseAdmin
		.from('tables')
		.select('*')
		.eq('restaurant_id', restaurantId)
		.order('table_number', { ascending: true });

	return {
		restaurant,
		tables: tables ?? [],
		userRole: locals.userRole ?? 'owner',
		userEmail: user.email ?? '',
		userName: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Owner'
	};
};
