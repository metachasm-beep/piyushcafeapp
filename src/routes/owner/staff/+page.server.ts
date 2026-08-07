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
	const user = locals.user;
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	// Allow owners (role may be set via restaurant_staff or owner_profiles fallback)
	const role = locals.userRole ?? 'owner';
	if (!['owner'].includes(role)) {
		throw error(403, 'Forbidden');
	}

	// Get restaurantId — may be set in locals, or look it up
	let restaurantId = locals.restaurantId;
	if (!restaurantId) {
		const { data: staffSelf } = await locals.supabase
			.from('restaurant_staff')
			.select('restaurant_id')
			.eq('user_id', user.id)
			.single();
		restaurantId = staffSelf?.restaurant_id;
	}

	if (!restaurantId) {
		return { staff: [] };
	}

	const { data: staff, error: dbError } = await locals.supabase
		.from('restaurant_staff')
		.select('*')
		.eq('restaurant_id', restaurantId)
		.order('created_at', { ascending: false });

	if (dbError) {
		console.error('Error loading staff:', dbError);
		throw error(500, 'Error loading staff');
	}

	// Enrich with emails from auth.users via admin client
	const supabaseAdmin = getSupabaseAdmin();
	const { data: authUsers, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers();
	
	let enrichedStaff = staff ?? [];
	if (!authUsersError && authUsers?.users) {
		enrichedStaff = enrichedStaff.map(s => {
			const u = authUsers.users.find(user => user.id === s.user_id);
			return { ...s, email: u?.email ?? 'Unknown' };
		});
	}

	return {
		staff: enrichedStaff,
		restaurantId
	};
};

export const actions: Actions = {
	invite: async ({ request, locals }) => {
		// Allow owners (role may be null for owners via owner_profiles path)
		const role = locals.userRole ?? 'owner';
		if (!['owner'].includes(role)) {
			return fail(403, { message: 'Forbidden' });
		}

		const data = await request.formData();
		const email = data.get('email')?.toString();
		const staffRole = data.get('role')?.toString();

		if (!email || !staffRole || !['chef', 'waiter'].includes(staffRole)) {
			return fail(400, { message: 'Invalid email or role' });
		}

		// Resolve restaurantId — may not be in locals for owners via owner_profiles path
		let restaurantId = locals.restaurantId;
		if (!restaurantId && locals.user) {
			const { data: staffSelf } = await locals.supabase
				.from('restaurant_staff')
				.select('restaurant_id')
				.eq('user_id', locals.user.id)
				.single();
			restaurantId = staffSelf?.restaurant_id;
		}

		if (!restaurantId) {
			return fail(400, { message: 'Could not determine your restaurant. Please refresh and try again.' });
		}

		try {
			const supabaseAdmin = getSupabaseAdmin();

			// 1. Create user in auth (or find if already exists)
			let userId: string;
			const password = Math.random().toString(36).slice(-10) + 'A1!';

			const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
				email,
				password,
				email_confirm: true
			});

			if (authError) {
				if (authError.message.includes('already exists') || authError.status === 422) {
					const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
					const existingUser = listData?.users.find(u => u.email === email);
					if (!existingUser) {
						return fail(400, { message: 'User already exists but could not be found.' });
					}
					userId = existingUser.id;
				} else {
					console.error('Create user error:', authError);
					return fail(400, { message: `Failed to create user: ${authError.message}` });
				}
			} else {
				userId = authData.user.id;
			}

			// 2. Upsert into owner_profiles so global auth guard allows login
			await supabaseAdmin
				.from('owner_profiles')
				.upsert({ id: userId, email, is_approved: true }, { onConflict: 'id' });

			// 3. Add to restaurant_staff
			const { error: insertError } = await supabaseAdmin
				.from('restaurant_staff')
				.upsert(
					{ user_id: userId, restaurant_id: restaurantId, role: staffRole },
					{ onConflict: 'user_id,restaurant_id' }
				);

			if (insertError) {
				console.error('Insert staff error:', insertError);
				return fail(500, { message: `Failed to add staff member: ${insertError.message}` });
			}

			return { success: true, message: `${email} added as ${staffRole}` };
		} catch (e) {
			console.error('Unexpected invite error:', e);
			return fail(500, { message: `Unexpected error: ${(e as Error).message}` });
		}
	},

	remove: async ({ request, locals }) => {
		const role = locals.userRole ?? 'owner';
		if (!['owner'].includes(role)) {
			return fail(403, { message: 'Forbidden' });
		}

		const data = await request.formData();
		const staffId = data.get('staffId')?.toString();

		if (!staffId) {
			return fail(400, { message: 'Missing staff ID' });
		}

		// Resolve restaurantId
		let restaurantId = locals.restaurantId;
		if (!restaurantId && locals.user) {
			const { data: staffSelf } = await locals.supabase
				.from('restaurant_staff')
				.select('restaurant_id')
				.eq('user_id', locals.user.id)
				.single();
			restaurantId = staffSelf?.restaurant_id;
		}

		try {
			// Use admin client so RLS doesn't block the delete
			const supabaseAdmin = getSupabaseAdmin();
			const { error: deleteError } = await supabaseAdmin
				.from('restaurant_staff')
				.delete()
				.eq('id', staffId)
				.eq('restaurant_id', restaurantId);

			if (deleteError) {
				console.error('Delete staff error:', deleteError);
				return fail(500, { message: `Failed to remove staff member: ${deleteError.message}` });
			}

			return { success: true };
		} catch (e) {
			console.error('Unexpected remove error:', e);
			return fail(500, { message: `Unexpected error: ${(e as Error).message}` });
		}
	}
};
