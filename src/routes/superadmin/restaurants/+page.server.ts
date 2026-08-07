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
				const errorMsg = authError.message.toLowerCase();
				if (errorMsg.includes('registered') || errorMsg.includes('exists') || errorMsg.includes('already')) {
					// Fallback: fetch users to find ID
					const { data: listData, error: listError } = await getSupabaseAdmin().auth.admin.listUsers();
					if (listError) {
						console.error('Error fetching list of users:', listError);
						return fail(500, { error: 'Could not fetch user list to resolve existing user.' });
					}
					const found = listData?.users?.find(u => u.email === email);
					if (found) {
						userId = found.id;
						console.log('Found existing auth user via listUsers:', userId);
						// We'll also ensure they exist in owner_profiles
						const { error: upsertError } = await getSupabaseAdmin().from('owner_profiles').upsert({ 
							id: userId, 
							email: email, 
							full_name: 'Superadmin Provisioned',
							restaurant_name: restaurant_name,
							is_approved: true 
						});
						if (upsertError) {
							console.error('Error upserting into owner_profiles:', upsertError);
							return fail(500, { error: `Database error setting up owner profile: ${upsertError.message}` });
						}
					} else {
						return fail(400, { error: 'User exists in auth but could not be located in list.' });
					}
				} else {
					console.error('Auth Error creating user:', authError);
					return fail(500, { error: authError.message });
				}
			} else {
				userId = authData.user?.id;
				console.log('Created auth user with ID:', userId);
				// We MUST ensure they exist in owner_profiles before creating the restaurant to satisfy foreign key constraints
				// Provide dummy full_name if required by schema since we only have email
				const { error: upsertError } = await getSupabaseAdmin().from('owner_profiles').upsert({ 
					id: userId, 
					email: email, 
					full_name: 'Superadmin Provisioned',
					restaurant_name: restaurant_name,
					is_approved: true 
				});
				if (upsertError) {
					console.error('Error upserting into owner_profiles:', upsertError);
					return fail(500, { error: `Database error setting up owner profile: ${upsertError.message}` });
				}
			}
		}

		if (!userId) {
			console.error('Failed to retrieve or create user ID');
			return fail(500, { error: 'Failed to retrieve or create user ID' });
		}

		// Generate a simple slug from the restaurant name
		const baseSlug = restaurant_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
		const randomSuffix = Math.random().toString(36).substring(2, 6);
		const slug = `${baseSlug}-${randomSuffix}`;

		// 2. Insert into restaurants table. We omit owner_id because ownership is linked 
		// via restaurant_staff and owner_id has a broken legacy foreign key constraint.
		const { data: restData, error: dbError } = await getSupabaseAdmin()
			.from('restaurants')
			.insert({
				name: restaurant_name,
				slug: slug
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
