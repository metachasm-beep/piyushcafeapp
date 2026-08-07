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
	const { data: staffDataList } = await supabaseAdmin
		.from('restaurant_staff')
		.select('restaurant_id')
		.eq('user_id', user.id);

	let restaurantId = staffDataList && staffDataList.length > 0 ? staffDataList[0].restaurant_id : null;

	if (!restaurantId) {
		// Fallback for owners who might not be in the staff table
		const { data: ownedRestaurantList } = await supabaseAdmin
			.from('restaurants')
			.select('id')
			.eq('owner_id', user.id);
			
		if (ownedRestaurantList && ownedRestaurantList.length > 0) {
			restaurantId = ownedRestaurantList[0].id;
		} else {
			// Second fallback: Maybe the user is the ONLY owner and there's only 1 restaurant?
			// We can try fetching the first restaurant if they are testing. 
			// But for now, just return null.
			return { restaurant: null };
		}
	}

	const { data: restaurantList } = await supabaseAdmin
		.from('restaurants')
		.select('*')
		.eq('id', restaurantId);

	const restaurant = restaurantList && restaurantList.length > 0 ? restaurantList[0] : null;

	if (!restaurant) {
		return { restaurant: null };
	}

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
