import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { createClient } from '@supabase/supabase-js';

const getSupabaseAdmin = () => {
	const supabaseUrl = publicEnv.PUBLIC_SUPABASE_URL;
	const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
	if (!supabaseUrl || !supabaseKey) {
		throw new Error('Supabase admin credentials missing');
	}
	return createClient(supabaseUrl, supabaseKey);
};

export const actions: Actions = {
	uploadLogo: async ({ request, locals }) => {
		const { session, userRole, restaurantId } = locals;
		
		if (!session || userRole !== 'owner' || !restaurantId) {
			return fail(401, { error: 'Unauthorized. You must be an owner to upload a logo.' });
		}

		const formData = await request.formData();
		const imageFile = formData.get('logo') as File;

		if (!imageFile || imageFile.size === 0) {
			return fail(400, { error: 'No image file provided' });
		}

		if (imageFile.size > 1 * 1024 * 1024) {
			return fail(400, { error: 'Image exceeds 1MB limit. Please choose a smaller file.' });
		}

		const supabaseAdmin = getSupabaseAdmin();
		const fileExt = imageFile.name.split('.').pop() || 'png';
		const fileName = `${restaurantId}_logo_${Date.now()}.${fileExt}`;
		const filePath = `${restaurantId}/${fileName}`;

		// Upload to restaurant-logos bucket using Admin client (bypasses RLS)
		const { error: uploadError } = await supabaseAdmin.storage
			.from('restaurant-logos')
			.upload(filePath, imageFile, { upsert: true });

		if (uploadError) {
			console.error('Upload error:', uploadError);
			return fail(500, { error: 'Storage Error: ' + uploadError.message });
		}

		// Get public URL
		const { data: { publicUrl } } = supabaseAdmin.storage
			.from('restaurant-logos')
			.getPublicUrl(filePath);

		// Update restaurants table using Admin client
		const { error: dbError } = await supabaseAdmin
			.from('restaurants')
			.update({ logo_url: publicUrl })
			.eq('id', restaurantId);

		if (dbError) {
			console.error('DB error:', dbError);
			return fail(500, { error: 'Database Error: ' + dbError.message });
		}

		return { success: true, publicUrl };
	}
};
