import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	// Superadmin (who meets the email criteria) can read all from owner_profiles 
	// assuming the RLS policy is set up properly.
	const { data: profiles, error } = await supabase
		.from('owner_profiles')
		.select('*')
		.order('created_at', { ascending: false });

	if (error) {
		console.error('Error fetching owner profiles:', error);
	}

	return {
		profiles: profiles ?? []
	};
};

export const actions: Actions = {
	toggleApproval: async ({ request, locals: { supabase } }) => {
		const data = await request.formData();
		const id = data.get('id');
		const currentState = data.get('currentState') === 'true';

		if (id && !currentState) {
			// They are being approved!
			
			// 1. Fetch their restaurant name
			const { data: profile } = await supabase
				.from('owner_profiles')
				.select('restaurant_name')
				.eq('id', id)
				.single();
			
			const restaurantName = profile?.restaurant_name || 'My Restaurant';

			// 2. Mark as approved
			const { error } = await supabase
				.from('owner_profiles')
				.update({ is_approved: true })
				.eq('id', id);

			if (error) {
				console.error('Error updating approval status:', error);
				return fail(500, { error: 'Failed to approve user' });
			}

			// 3. Auto-create restaurant
			// We need a unique slug based on the restaurant name
			const baseSlug = restaurantName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
			const randomSuffix = Math.random().toString(36).substring(2, 6);
			const slug = `${baseSlug || 'restaurant'}-${randomSuffix}`;

			// We need service role key to insert restaurant since superadmin policy might not allow it directly through this client
			// Wait, the superadmin might be able to. But just to be safe, we'll try with the current client.
			// Actually, restaurants are RLS protected.
			// Let's import getSupabaseAdmin from the restaurants route or recreate it here.
			const { env } = await import('$env/dynamic/private');
			const { publicEnv } = await import('$env/dynamic/public');
			const { createClient } = await import('@supabase/supabase-js');
			
			const supabaseUrl = publicEnv?.PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
			const supabaseKey = env?.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
			
			if (supabaseUrl && supabaseKey) {
				const adminClient = createClient(supabaseUrl, supabaseKey);
				
				const { data: restData, error: dbError } = await adminClient
					.from('restaurants')
					.insert({
						name: restaurantName,
						slug: slug
					})
					.select('id')
					.single();

				if (dbError) {
					console.error('DB Error auto-creating restaurant:', dbError);
				} else if (restData) {
					// 4. Link owner via restaurant_staff
					const { error: staffError } = await adminClient
						.from('restaurant_staff')
						.insert({
							restaurant_id: restData.id,
							user_id: id,
							role: 'owner'
						});
						
					if (staffError) {
						console.error('Error auto-linking owner to restaurant:', staffError);
					}
				}
			} else {
				console.error('Cannot auto-create restaurant: Missing admin credentials');
			}

		} else if (id && currentState) {
			// They are being revoked
			
			const { env } = await import('$env/dynamic/private');
			const { publicEnv } = await import('$env/dynamic/public');
			const { createClient } = await import('@supabase/supabase-js');
			
			const supabaseUrl = publicEnv?.PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
			const supabaseKey = env?.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
			
			if (supabaseUrl && supabaseKey) {
				const adminClient = createClient(supabaseUrl, supabaseKey);
				
				// 1. Find their restaurant
				const { data: staffData } = await adminClient
					.from('restaurant_staff')
					.select('restaurant_id')
					.eq('user_id', id)
					.eq('role', 'owner')
					.single();
					
				// 2. Delete the restaurant (this cascades to staff, menus, tables, orders)
				if (staffData?.restaurant_id) {
					await adminClient.from('restaurants').delete().eq('id', staffData.restaurant_id);
				}
			}

			// 3. Mark as unapproved
			const { error } = await supabase
				.from('owner_profiles')
				.update({ is_approved: false })
				.eq('id', id);

			if (error) {
				console.error('Error updating approval status:', error);
			}
		}

		return { success: true };
	},
	denyApproval: async ({ request, locals: { supabase } }) => {
		const data = await request.formData();
		const id = data.get('id');

		if (id) {
			const { env } = await import('$env/dynamic/private');
			const { publicEnv } = await import('$env/dynamic/public');
			const { createClient } = await import('@supabase/supabase-js');
			
			const supabaseUrl = publicEnv?.PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
			const supabaseKey = env?.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
			
			if (supabaseUrl && supabaseKey) {
				const adminClient = createClient(supabaseUrl, supabaseKey);
				
				// 1. Find their restaurant
				const { data: staffData } = await adminClient
					.from('restaurant_staff')
					.select('restaurant_id')
					.eq('user_id', id)
					.eq('role', 'owner')
					.single();
					
				// 2. Delete the restaurant (this cascades)
				if (staffData?.restaurant_id) {
					await adminClient.from('restaurants').delete().eq('id', staffData.restaurant_id);
				}
				
				// 3. Delete the auth user entirely to ensure they don't exist without a restaurant
				// since "owner cannot exist without restaurant". 
				await adminClient.auth.admin.deleteUser(id);
			}

			const { error } = await supabase
				.from('owner_profiles')
				.delete()
				.eq('id', id);

			if (error) {
				console.error('Error denying approval (deleting profile):', error);
			}
		}

		return { success: true };
	}
};
