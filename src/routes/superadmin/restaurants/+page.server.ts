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

		let userId = null;

		// 1. Try to find the user in owner_profiles
		const { data: existingProfile } = await getSupabaseAdmin()
			.from('owner_profiles')
			.select('id')
			.eq('email', email)
			.single();

		if (existingProfile && existingProfile.id) {
			userId = existingProfile.id;
			console.log('Found existing user in owner_profiles:', userId);
			
			// Auto-approve them since we are provisioning a node for them
			await getSupabaseAdmin().from('owner_profiles').update({ is_approved: true }).eq('id', userId);
		} else {
			// Try to create the user in Auth
			const { data: authData, error: authError } = await getSupabaseAdmin().auth.admin.createUser({
				email,
				password,
				email_confirm: true
			});

			if (authError) {
				if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
					// Fallback: fetch users to find ID
					const { data: listData } = await getSupabaseAdmin().auth.admin.listUsers();
					const found = listData?.users?.find(u => u.email === email);
					if (found) {
						userId = found.id;
						console.log('Found existing auth user via listUsers:', userId);
						await getSupabaseAdmin().from('owner_profiles').update({ is_approved: true }).eq('id', userId);
					} else {
						return fail(400, { error: 'User already registered but could not be located.' });
					}
				} else {
					console.error('Auth Error creating user:', authError);
					return fail(500, { error: authError.message });
				}
			} else {
				userId = authData.user?.id;
				console.log('Created auth user with ID:', userId);
			}
		}

		if (!userId) {
			console.error('Failed to retrieve or create user ID');
			return fail(500, { error: 'Failed to retrieve or create user ID' });
		}

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
