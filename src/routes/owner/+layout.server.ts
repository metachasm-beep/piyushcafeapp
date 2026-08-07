import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const { supabase, user } = locals;
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

	let restaurantId = staffData?.restaurant_id;

	if (!restaurantId) {
		// Fallback for owners who might not be in the staff table
		const { data: ownedRestaurant } = await supabase
			.from('restaurants')
			.select('id')
			.eq('owner_id', user.id)
			.limit(1)
			.single();
			
		if (ownedRestaurant) {
			restaurantId = ownedRestaurant.id;
		} else {
			return { restaurant: null };
		}
	}

	const { data: restaurant } = await supabase
		.from('restaurants')
		.select('*')
		.eq('id', restaurantId)
		.limit(1)
		.single();

	const { data: tables } = await supabase
		.from('tables')
		.select('*')
		.eq('restaurant_id', staffData.restaurant_id)
		.order('table_number', { ascending: true });

	return {
		restaurant,
		tables: tables ?? [],
		userRole: locals.userRole ?? 'owner',
		userEmail: user.email ?? '',
		userName: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Owner'
	};
};
