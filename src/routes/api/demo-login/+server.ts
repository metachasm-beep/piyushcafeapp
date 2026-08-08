import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
	const supabaseUrl = publicEnv.PUBLIC_SUPABASE_URL;
	const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
	if (!supabaseUrl || !supabaseKey) return json({ error: 'Missing env' }, { status: 500 });
	
	const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
	
	const DEMO_EMAIL = 'demo@goldenfork.com';
	const DEMO_REST_ID = 'd793b827-0466-4cf8-8424-df38d21c0eb2';
	
	const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
	if (listError) return json({ error: listError }, { status: 500 });
	
	let user = users.users.find(u => u.email === DEMO_EMAIL);
	if (!user) {
		const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
			email: DEMO_EMAIL,
			password: 'password123',
			email_confirm: true
		});
		if (createError) return json({ error: createError }, { status: 500 });
		user = newUser.user;
	} else {
		const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, { password: 'password123' });
		if (updateError) return json({ error: updateError }, { status: 500 });
	}

	// Self-heal demo data connections
	await supabaseAdmin.from('owner_profiles').upsert({ id: user.id, email: DEMO_EMAIL, is_approved: true });
	await supabaseAdmin.from('restaurants').upsert({ 
		id: DEMO_REST_ID, 
		name: 'The Golden Fork Demo', 
		slug: 'golden-fork-demo', 
		owner_id: user.id, 
		logo_url: 'https://api.dicebear.com/7.x/shapes/svg?seed=GoldenFork&backgroundColor=F59E0B', 
		wifi_password: 'wifi123' 
	});
	await supabaseAdmin.from('restaurant_staff').upsert({ user_id: user.id, restaurant_id: DEMO_REST_ID, role: 'owner' });

	return json({ success: true });
}
