import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
	const supabaseUrl = publicEnv.PUBLIC_SUPABASE_URL;
	const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
	if (!supabaseUrl || !supabaseKey) return json({ error: 'Missing env' }, { status: 500 });
	
	const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
	
	const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
	if (listError) return json({ error: listError }, { status: 500 });
	
	const user = users.users.find(u => u.email === 'paullovessoccer@gmail.com');
	if (!user) return json({ error: 'User not found' }, { status: 404 });
	
	const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, { password: 'password123' });
	if (updateError) return json({ error: updateError }, { status: 500 });
	
	return json({ success: true });
}
