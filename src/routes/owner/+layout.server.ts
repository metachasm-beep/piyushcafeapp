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

	let restaurant = null;
	let validRestaurantId = null;
	let debugInfo = { step: 'init', email: user.email, user_id: user.id, profiles: null, restaurant: null };

	// 1. If hooks.server.ts found a direct staff mapping, use it! (Covers chefs, waiters, and exact-match owners)
	if (locals.restaurantId) {
		debugInfo.step = 'fetching_via_locals';
		const { data: restaurantList } = await supabaseAdmin
			.from('restaurants')
			.select('*')
			.eq('id', locals.restaurantId)
			.limit(1);

		if (restaurantList && restaurantList.length > 0) {
			restaurant = restaurantList[0];
			validRestaurantId = restaurant.id;
		}
	}

	// 2. Strict Fallback: If no direct mapping exists (e.g., Google OAuth created a new ID),
	// fetch via the canonical owner_profiles and the strict owner_id on the restaurants table.
	if (!restaurant && user.email) {
		debugInfo.step = 'fetching_canonical_profile';
		const { data: profiles } = await supabaseAdmin
			.from('owner_profiles')
			.select('id')
			.ilike('email', user.email);
			
		debugInfo.profiles = profiles;
			
		if (profiles && profiles.length > 0) {
			const canonicalIds = profiles.map(p => p.id);
			debugInfo.step = 'fetching_restaurant_by_owner_id';

			const { data: restaurantList } = await supabaseAdmin
				.from('restaurants')
				.select('*')
				.in('owner_id', canonicalIds)
				.limit(1);
				
			debugInfo.restaurant = restaurantList;
				
			if (restaurantList && restaurantList.length > 0) {
				restaurant = restaurantList[0];
				validRestaurantId = restaurant.id;
				
				// Optional self-healing for the staff table so future lookups are fast
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
