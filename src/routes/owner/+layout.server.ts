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

	let restaurantIds = staffDataList?.map(s => s.restaurant_id) || [];
	let restaurant = null;
	let validRestaurantId = null;

	if (restaurantIds.length > 0) {
		const { data: restaurantList } = await supabaseAdmin
			.from('restaurants')
			.select('*')
			.in('id', restaurantIds)
			.limit(1);

		if (restaurantList && restaurantList.length > 0) {
			restaurant = restaurantList[0];
			validRestaurantId = restaurant.id;
		}
	}

	let debugInfo = { step: 'init', email: user.email, user_id: user.id, profiles: null, staff: null };

	if (!restaurant && user.email) {
		debugInfo.step = 'fallback_started';
		// Fallback: Check if ANY user with this email has a VALID restaurant. 
		// This solves issues where a Google OAuth login creates a new Auth user 
		// that differs from the one the Superadmin provisioned against.
		const { data: profiles } = await supabaseAdmin
			.from('owner_profiles')
			.select('id')
			.ilike('email', user.email);
			
		debugInfo.profiles = profiles;
			
		if (profiles && profiles.length > 0) {
			const profileIds = profiles.map(p => p.id);
			const { data: emailStaffList } = await supabaseAdmin
				.from('restaurant_staff')
				.select('restaurant_id')
				.in('user_id', profileIds);
				
			debugInfo.staff = emailStaffList;
				
			if (emailStaffList && emailStaffList.length > 0) {
				const fallbackRestaurantIds = emailStaffList.map(s => s.restaurant_id);
				const { data: fallbackRestaurants } = await supabaseAdmin
					.from('restaurants')
					.select('*')
					.in('id', fallbackRestaurantIds)
					.limit(1);
					
				if (fallbackRestaurants && fallbackRestaurants.length > 0) {
					restaurant = fallbackRestaurants[0];
					validRestaurantId = restaurant.id;
					
					// Self-healing: Link this current user ID to the valid restaurant as well
					await supabaseAdmin.from('restaurant_staff').insert({
						restaurant_id: validRestaurantId,
						user_id: user.id,
						role: 'owner'
					});
					await supabaseAdmin.from('owner_profiles').upsert({
						id: user.id,
						email: user.email,
						is_approved: true
					});
				}
			}
		}
	}

	if (!restaurant || !validRestaurantId) {
		return { restaurant: null, debugInfo };
	}

	const { data: tables } = await supabaseAdmin
		.from('tables')
		.select('*')
		.eq('restaurant_id', validRestaurantId)
		.order('table_number', { ascending: true });

	return {
		restaurant,
		tables: tables ?? [],
		userRole: locals.userRole ?? 'owner',
		userEmail: user.email ?? '',
		userName: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Owner'
	};
};
