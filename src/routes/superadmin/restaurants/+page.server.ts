import { fail } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import type { Actions, PageServerLoad } from './$types';

const getSupabaseAdmin = () => {
	const supabaseUrl = publicEnv.PUBLIC_SUPABASE_URL;
	const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
	if (!supabaseUrl || !supabaseKey) {
		throw new Error('Supabase admin credentials missing');
	}
	return createClient(supabaseUrl, supabaseKey);
};

export const load: PageServerLoad = async () => {
	const { data: restaurants, error } = await getSupabaseAdmin()
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
		const { data: authData, error: authError } = await getSupabaseAdmin().auth.admin.createUser({
			email,
			password,
			email_confirm: true
		});

		if (authError) {
			console.error('Auth Error creating user:', authError);
			return fail(500, { error: authError.message });
		}

		const userId = authData.user?.id;
		if (!userId) {
			console.error('Failed to retrieve created user ID');
			return fail(500, { error: 'Failed to retrieve created user ID' });
		}

		console.log('Created auth user with ID:', userId);

		// 2. Insert into restaurants table linked to owner_id
		const { data: restData, error: dbError } = await getSupabaseAdmin()
			.from('restaurants')
			.insert({
				owner_id: userId,
				name: restaurant_name
			})
			.select('id')
			.single();

		if (dbError) {
			console.error('DB Error inserting restaurant:', dbError);
			return fail(500, { error: dbError.message });
		}

		if (restData) {
			const { error: staffError } = await getSupabaseAdmin()
				.from('restaurant_staff')
				.insert({
					restaurant_id: restData.id,
					user_id: userId,
					role: 'owner'
				});
				
			if (staffError) {
				console.error('Error adding to restaurant_staff:', staffError);
				// We don't fail the whole request since the restaurant was created, but log it.
			}
		}

		console.log('Successfully provisioned restaurant:', restaurant_name);
		return { success: true };
	}
};
