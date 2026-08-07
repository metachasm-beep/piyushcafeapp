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

	if (!restaurantId && user.email) {
		// Fallback: Check if ANY user with this email has a restaurant. 
		// This solves issues where a Google OAuth login creates a new Auth user 
		// that differs from the one the Superadmin provisioned against.
		const { data: profiles } = await supabaseAdmin
			.from('owner_profiles')
			.select('id')
			.eq('email', user.email);
			
		if (profiles && profiles.length > 0) {
			const profileIds = profiles.map(p => p.id);
			const { data: emailStaffList } = await supabaseAdmin
				.from('restaurant_staff')
				.select('restaurant_id')
				.in('user_id', profileIds);
				
			if (emailStaffList && emailStaffList.length > 0) {
				restaurantId = emailStaffList[0].restaurant_id;
				
				// Self-healing: Link this current user ID to the restaurant as well
				await supabaseAdmin.from('restaurant_staff').insert({
					restaurant_id: restaurantId,
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

	if (!restaurantId) {
		return { restaurant: null };
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
