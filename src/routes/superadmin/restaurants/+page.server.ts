import { fail } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import type { Actions, PageServerLoad } from './$types';

const supabaseUrl = publicEnv.PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || 'mock-key';

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export const load: PageServerLoad = async () => {
	const { data: restaurants, error } = await supabaseAdmin
		.from('restaurants')
		.select('*')
		.order('created_at', { ascending: false });

	if (error) {
		console.error('Error fetching restaurants:', error);
		return {
			restaurants: []
		};
	}

	return {
		restaurants: restaurants || []
	};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const restaurant_name = formData.get('restaurant_name') as string;

		if (!email || !password || !restaurant_name) {
			return fail(400, { error: 'All fields are required' });
		}

		// 1. Create the user in Auth
		const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
			email,
			password,
			email_confirm: true
		});

		if (authError) {
			return fail(500, { error: authError.message });
		}

		const userId = authData.user?.id;
		if (!userId) {
			return fail(500, { error: 'Failed to retrieve created user ID' });
		}

		// 2. Insert into restaurants table linked to owner_id
		const { error: dbError } = await supabaseAdmin
			.from('restaurants')
			.insert({
				owner_id: userId,
				name: restaurant_name
			});

		if (dbError) {
			return fail(500, { error: dbError.message });
		}

		return { success: true };
	}
};
