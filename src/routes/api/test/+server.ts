import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { createClient } from '@supabase/supabase-js';

export const GET = async () => {
    const supabaseUrl = publicEnv.PUBLIC_SUPABASE_URL;
    const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl || '', supabaseKey || '');

    const { data: restaurants } = await supabase.from('restaurants').select('*');
    const { data: staff } = await supabase.from('restaurant_staff').select('*');
    const { data: profiles } = await supabase.from('owner_profiles').select('*');
    const { data: users } = await supabase.auth.admin.listUsers();

    return json({
        restaurants,
        staff,
        profiles,
        users: users?.users?.map(u => ({ id: u.id, email: u.email }))
    });
};
