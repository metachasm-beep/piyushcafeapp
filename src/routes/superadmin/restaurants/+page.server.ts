import { fail } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { MOCK_RESTAURANT } from '$lib/mock-data';
import type { Actions, PageServerLoad } from './$types';

const supabaseUrl = publicEnv.PUBLIC_SUPABASE_URL || '';
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || '';
const configured = Boolean(supabaseUrl && supabaseKey && !supabaseUrl.includes('mock'));

const supabaseAdmin = configured
	? createClient(supabaseUrl, supabaseKey)
	: null;

export const load: PageServerLoad = async () => {
	if (!supabaseAdmin) {
		return {
			restaurants: [MOCK_RESTAURANT],
			loadError: null as string | null,
			usingMock: true
		};
	}

	const { data: restaurants, error } = await supabaseAdmin
		.from('restaurants')
		.select('*')
		.order('created_at', { ascending: false });

	if (error) {
		console.error('Error fetching restaurants:', error);
		return {
			restaurants: [] as typeof MOCK_RESTAURANT[],
			loadError: error.message,
			usingMock: false
		};
	}

	return {
		restaurants: restaurants || [],
		loadError: null as string | null,
		usingMock: false
	};
};

export const actions: Actions = {
	default: async ({ request }) => {
		if (!supabaseAdmin) {
			return fail(503, { error: 'Supabase service role is not configured' });
		}

		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const restaurant_name = formData.get('restaurant_name') as string;

		if (!email || !password || !restaurant_name) {
			return fail(400, { error: 'All fields are required' });
		}

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

		const { error: dbError } = await supabaseAdmin.from('restaurants').insert({
			owner_id: userId,
			name: restaurant_name,
			is_active: true
		});

		if (dbError) {
			return fail(500, { error: dbError.message });
		}

		return { success: true };
	}
};
