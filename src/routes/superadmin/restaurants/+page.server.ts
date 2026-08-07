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
		.select(`
			*,
			restaurant_staff (
				user_id,
				role
			)
		`)
		.order('created_at', { ascending: false });

	if (error) {
		console.error('Error fetching restaurants:', error);
		return {
			restaurants: []
		};
	}

	const { data: ownerProfiles, error: ownerError } = await getSupabaseAdmin()
		.from('owner_profiles')
		.select('id, email');
		
	if (ownerError) {
		console.error('Error fetching owner profiles:', ownerError);
	}
	
	const ownerEmailMap = new Map(ownerProfiles?.map(op => [op.id, op.email]) || []);

	// Transform data to inject owner_id and owner_email from restaurant_staff
	const transformedRestaurants = (restaurants || []).map(r => {
		const ownerStaff = r.restaurant_staff?.find((s: any) => s.role === 'owner');
		const ownerId = ownerStaff?.user_id || null;
		return {
			...r,
			owner_id: ownerId,
			owner_email: ownerId ? ownerEmailMap.get(ownerId) || 'Unknown' : 'Unassigned'
		};
	});

	return {
		restaurants: transformedRestaurants
	};
};

export const actions: Actions = {
	createRestaurant: async ({ request }) => {
		const formData = await request.formData();
		let emailRaw = formData.get('email') as string;
		const restaurant_name = formData.get('restaurant_name') as string;

		if (!emailRaw || !restaurant_name) {
			return fail(400, { error: 'Email and Restaurant Name are required' });
		}
		
		const email = emailRaw.toLowerCase();

		// Generate a strong random password for initial auth creation
		const password = crypto.randomUUID() + crypto.randomUUID();

		let userIds: string[] = [];

		// 1. Try to find all users in owner_profiles with this email
		const { data: existingProfiles } = await getSupabaseAdmin()
			.from('owner_profiles')
			.select('id')
			.ilike('email', email);

		if (existingProfiles && existingProfiles.length > 0) {
			userIds = existingProfiles.map(p => p.id);
			console.log('Found existing users in owner_profiles:', userIds);
			
			// Auto-approve them all
			for (const id of userIds) {
				await getSupabaseAdmin().from('owner_profiles').update({ is_approved: true }).eq('id', id);
			}
		}

		// Also check Auth directly to catch any Google users not in owner_profiles yet
		const { data: listData } = await getSupabaseAdmin().auth.admin.listUsers();
		const authUsers = listData?.users?.filter(u => u.email === email) || [];
		
		for (const authUser of authUsers) {
			if (!userIds.includes(authUser.id)) {
				userIds.push(authUser.id);
				// Ensure they exist in owner_profiles and are approved
				await getSupabaseAdmin().from('owner_profiles').upsert({ 
					id: authUser.id, 
					email: email, 
					is_approved: true 
				});
			}
		}

		if (userIds.length === 0) {
			// Try to create the user in Auth
			const { data: authData, error: authError } = await getSupabaseAdmin().auth.admin.createUser({
				email,
				password,
				email_confirm: true
			});

			if (authError) {
				console.error('Auth Error creating user:', authError);
				return fail(500, { error: authError.message });
			} else if (authData.user) {
				userIds.push(authData.user.id);
				console.log('Created auth user with ID:', authData.user.id);
				await getSupabaseAdmin().from('owner_profiles').upsert({ 
					id: authData.user.id, 
					email: email, 
					is_approved: true 
				});
			}
		}

		if (userIds.length === 0) {
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
			for (const id of userIds) {
				const { error: staffError } = await getSupabaseAdmin()
					.from('restaurant_staff')
					.insert({
						restaurant_id: restData.id,
						user_id: id,
						role: 'owner'
					});
					
				if (staffError) {
					console.error(`Error adding ${id} to restaurant_staff:`, staffError);
				}
			}
		}

		console.log('Successfully provisioned restaurant:', restaurant_name);
		return { success: true };
	},
	editRestaurant: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const name = formData.get('name') as string;

		if (!id || !name) {
			return fail(400, { error: 'Restaurant ID and Name are required' });
		}

		const { error } = await getSupabaseAdmin()
			.from('restaurants')
			.update({ name })
			.eq('id', id);

		if (error) {
			console.error('Error updating restaurant:', error);
			return fail(500, { error: error.message });
		}

		return { success: true };
	},
	deleteRestaurant: async ({ request }) => {
		const formData = await request.formData();
		const restaurant_id = formData.get('restaurant_id') as string;

		if (!restaurant_id) {
			return fail(400, { error: 'Restaurant ID is required' });
		}

		// 1. Find the owner to delete them too
		const { data: staffData } = await getSupabaseAdmin()
			.from('restaurant_staff')
			.select('user_id')
			.eq('restaurant_id', restaurant_id)
			.eq('role', 'owner')
			.single();

		// 2. Delete the restaurant (cascades to staff, menu, etc)
		const { error: deleteError } = await getSupabaseAdmin()
			.from('restaurants')
			.delete()
			.eq('id', restaurant_id);

		if (deleteError) {
			console.error('Error deleting restaurant:', deleteError);
			return fail(500, { error: 'Failed to delete restaurant' });
		}

		// 3. Delete the owner profile and auth user
		if (staffData?.user_id) {
			await getSupabaseAdmin().from('owner_profiles').delete().eq('id', staffData.user_id);
			await getSupabaseAdmin().auth.admin.deleteUser(staffData.user_id);
		}

		return { success: true };
	}
};
