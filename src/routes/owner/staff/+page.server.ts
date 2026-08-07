import { error, fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { createClient } from '@supabase/supabase-js';
import type { Actions, PageServerLoad } from './$types';

const getSupabaseAdmin = () => {
	const supabaseUrl = publicEnv.PUBLIC_SUPABASE_URL;
	const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
	if (!supabaseUrl || !supabaseKey) {
		throw new Error('Supabase admin credentials missing');
	}
	return createClient(supabaseUrl, supabaseKey);
};

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.getSession();
	if (!session) {
		throw error(401, 'Unauthorized');
	}

	// Make sure only the owner can access this
	if (locals.userRole !== 'owner') {
		throw error(403, 'Forbidden');
	}

	const { data: staff, error: dbError } = await locals.supabase
		.from('restaurant_staff')
		.select('*')
		.eq('restaurant_id', locals.restaurantId)
		.order('created_at', { ascending: false });

	if (dbError) {
		throw error(500, 'Error loading staff');
	}

	// Join with auth users to get emails?
	// Wait, we can't easily join auth.users in standard supabase select without special privileges.
	// We will query auth.users using supabaseAdmin.
	const supabaseAdmin = getSupabaseAdmin();
	const { data: authUsers, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers();
	
	let enrichedStaff = staff;
	if (!authUsersError && authUsers.users) {
		enrichedStaff = staff.map(s => {
			const u = authUsers.users.find(user => user.id === s.user_id);
			return {
				...s,
				email: u ? u.email : 'Unknown'
			};
		});
	}

	return {
		staff: enrichedStaff || []
	};
};

export const actions: Actions = {
	invite: async ({ request, locals }) => {
		if (locals.userRole !== 'owner') {
			return fail(403, { message: 'Forbidden' });
		}

		const data = await request.formData();
		const email = data.get('email')?.toString();
		const role = data.get('role')?.toString(); // 'chef' or 'waiter'

		if (!email || !role || !['chef', 'waiter'].includes(role)) {
			return fail(400, { message: 'Invalid email or role' });
		}

		const supabaseAdmin = getSupabaseAdmin();

		// 1. Create User in Auth (or fetch if exists)
		let userId: string;
		// Generate random password
		const password = Math.random().toString(36).slice(-10) + 'A1!'; 
		
		const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
			email,
			password,
			email_confirm: true
		});

		if (authError) {
			// If user already exists, we could try to find them by email.
			// Supabase createUser fails if user exists.
			if (authError.message.includes('already exists') || authError.status === 422) {
				// We can't fetch by email directly without a specific method, let's list and find
				const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
				const existingUser = listData.users.find(u => u.email === email);
				if (!existingUser) {
					return fail(400, { message: 'Failed to create or find user' });
				}
				userId = existingUser.id;
			} else {
				console.error('Create user error:', authError);
				return fail(400, { message: 'Failed to create user account' });
			}
		} else {
			userId = authData.user.id;
		}

		// 2. Add to owner_profiles so they can log in via global guard
		// (Assuming we still check owner_profiles for login)
		await supabaseAdmin
			.from('owner_profiles')
			.upsert({ id: userId, email, is_approved: true }, { onConflict: 'id' });

		// 3. Add to restaurant_staff
		const { error: insertError } = await supabaseAdmin
			.from('restaurant_staff')
			.upsert({
				user_id: userId,
				restaurant_id: locals.restaurantId,
				role: role
			}, { onConflict: 'user_id,restaurant_id' });

		if (insertError) {
			console.error('Insert staff error:', insertError);
			return fail(500, { message: 'Failed to add staff member' });
		}

		return { success: true };
	},

	remove: async ({ request, locals }) => {
		if (locals.userRole !== 'owner') {
			return fail(403, { message: 'Forbidden' });
		}

		const data = await request.formData();
		const staffId = data.get('staffId')?.toString();

		if (!staffId) {
			return fail(400, { message: 'Missing staff ID' });
		}

		// Delete from restaurant_staff
		const { error: deleteError } = await locals.supabase
			.from('restaurant_staff')
			.delete()
			.eq('id', staffId)
			.eq('restaurant_id', locals.restaurantId);

		if (deleteError) {
			console.error('Delete staff error:', deleteError);
			return fail(500, { message: 'Failed to remove staff member' });
		}

		return { success: true };
	}
};
