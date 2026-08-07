import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
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

export const GET: RequestHandler = async ({ url }) => {
	const email = url.searchParams.get('email');
	if (!email) {
		return json({ error: 'Please provide an email parameter: ?email=owner@example.com' });
	}

	const supabaseAdmin = getSupabaseAdmin();
	
	try {
		// 1. Check Auth Users
		const { data: listData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
		const authUsers = listData?.users?.filter(u => u.email?.toLowerCase() === email.toLowerCase()) || [];

		// 2. Check Owner Profiles
		const { data: profiles, error: profilesError } = await supabaseAdmin
			.from('owner_profiles')
			.select('*')
			.ilike('email', email);

		// 3. Check Restaurant Staff
		const profileIds = profiles?.map(p => p.id) || [];
		const authIds = authUsers.map(u => u.id);
		const allIds = [...new Set([...profileIds, ...authIds])];
		
		let staffList = [];
		let staffError = null;
		if (allIds.length > 0) {
			const res = await supabaseAdmin
				.from('restaurant_staff')
				.select('*')
				.in('user_id', allIds);
			staffList = res.data || [];
			staffError = res.error;
		}

		// 4. Check Restaurants
		const restaurantIds = staffList.map(s => s.restaurant_id);
		let restaurants = [];
		let restError = null;
		if (restaurantIds.length > 0) {
			const res = await supabaseAdmin
				.from('restaurants')
				.select('*')
				.in('id', restaurantIds);
			restaurants = res.data || [];
			restError = res.error;
		}

		return json({
			email_searched: email,
			auth_users: authUsers.map(u => ({ id: u.id, email: u.email })),
			auth_error: authError,
			owner_profiles: profiles,
			profiles_error: profilesError,
			restaurant_staff: staffList,
			staff_error: staffError,
			restaurants: restaurants,
			restaurants_error: restError,
		});
	} catch (e: any) {
		return json({ error: e.message });
	}
};
