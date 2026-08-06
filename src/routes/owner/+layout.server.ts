import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { supabase, user } }) => {
	if (!user) {
		return { restaurant: null };
	}

	// Fetch the restaurant the owner belongs to
	const { data: staffData } = await supabase
		.from('restaurant_staff')
		.select('restaurant_id')
		.eq('user_id', user.id)
		.limit(1)
		.single();

	if (!staffData) {
		return { restaurant: null };
	}

	const { data: restaurant } = await supabase
		.from('restaurants')
		.select('*')
		.eq('id', staffData.restaurant_id)
		.limit(1)
		.single();

	return {
		restaurant
	};
};
