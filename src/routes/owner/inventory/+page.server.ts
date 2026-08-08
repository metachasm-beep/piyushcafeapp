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
	addCategory: async ({ request, locals }) => {
		const { session, userRole, restaurantId } = locals;
		
		if (!session || userRole !== 'owner' || !restaurantId) {
			return fail(401, { error: 'Unauthorized. You must be an owner.' });
		}

		const formData = await request.formData();
		const name = formData.get('name')?.toString();
		const sortOrderStr = formData.get('sort_order')?.toString();

		if (!name) {
			return fail(400, { error: 'Category name is required' });
		}

		const supabaseAdmin = getSupabaseAdmin();
		const newCat = {
			id: crypto.randomUUID(),
			restaurant_id: restaurantId,
			name: name.trim(),
			icon_emoji: '🍽️',
			sort_order: sortOrderStr ? parseInt(sortOrderStr, 10) : 0,
			is_active: true
		};

		const { error: dbError } = await supabaseAdmin
			.from('menu_categories')
			.insert(newCat);

		if (dbError) {
			console.error('DB error adding category:', dbError);
			return fail(500, { error: 'Database Error: ' + dbError.message });
		}

		return { success: true, category: newCat };
	},

	addItem: async ({ request, locals }) => {
		const { session, userRole, restaurantId } = locals;
		
		if (!session || userRole !== 'owner' || !restaurantId) {
			return fail(401, { error: 'Unauthorized.' });
		}

		const formData = await request.formData();
		const supabaseAdmin = getSupabaseAdmin();
		
		let imageUrl = null;
		const imageFile = formData.get('image') as File;

		// 1. Upload Image if provided
		if (imageFile && imageFile.size > 0) {
			const fileExt = imageFile.name.split('.').pop();
			const fileName = `${crypto.randomUUID()}.${fileExt}`;
			const filePath = `${restaurantId}/${fileName}`;
			
			const { error: uploadError } = await supabaseAdmin.storage
				.from('menu-images')
				.upload(filePath, imageFile);
				
			if (uploadError) {
				return fail(500, { error: 'Failed to upload image' });
			}
			
			const { data: { publicUrl } } = supabaseAdmin.storage
				.from('menu-images')
				.getPublicUrl(filePath);
				
			imageUrl = publicUrl;
		}

		// 2. Insert Menu Item
		const newItem = {
			id: crypto.randomUUID(),
			restaurant_id: restaurantId,
			category_id: formData.get('category_id')?.toString(),
			name: formData.get('name')?.toString(),
			description: formData.get('description')?.toString(),
			price: Number(formData.get('price')),
			image_url: imageUrl,
			is_available: true,
			is_featured: formData.get('is_featured') === 'on',
			dietary_tags: []
		};
		
		const { data: itemResp, error: dbError } = await supabaseAdmin.from('menu_items').insert(newItem).select().single();
		if (dbError) {
			return fail(500, { error: 'Failed to insert menu item' });
		}
		
		// 3. Insert Variations & Addons
		try {
			const variationsStr = formData.get('variations')?.toString();
			if (variationsStr) {
				const variations = JSON.parse(variationsStr);
				const validVars = variations.filter((v: any) => v.name.trim() !== '').map((v: any, idx: number) => ({
					menu_item_id: itemResp.id,
					name: v.name.trim(),
					extra_price: Number(v.extra_price),
					sort_order: idx
				}));
				if (validVars.length > 0) await supabaseAdmin.from('menu_item_variations').insert(validVars);
			}

			const addonsStr = formData.get('addons')?.toString();
			if (addonsStr) {
				const addons = JSON.parse(addonsStr);
				const validAddons = addons.filter((a: any) => a.name.trim() !== '').map((a: any, idx: number) => ({
					menu_item_id: itemResp.id,
					name: a.name.trim(),
					extra_price: Number(a.extra_price),
					sort_order: idx
				}));
				if (validAddons.length > 0) await supabaseAdmin.from('menu_item_addons').insert(validAddons);
			}
		} catch (e) {
			console.error('Error parsing variations/addons', e);
		}

		return { success: true, item: itemResp };
	}
};
