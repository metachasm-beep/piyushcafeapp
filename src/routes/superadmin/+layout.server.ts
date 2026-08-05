import type { LayoutServerLoad } from './$types';
import { supabase } from '$lib/supabase';
import { MOCK_RESTAURANT } from '$lib/mock-data';

export const load: LayoutServerLoad = async () => {
	if (!supabase) {
		return {
			restaurants: [{ id: MOCK_RESTAURANT.id, name: MOCK_RESTAURANT.name }],
			loadError: null as string | null
		};
	}

	const { data, error } = await supabase
		.from('restaurants')
		.select('id, name, is_active')
		.order('name');

	if (error) {
		return {
			restaurants: [{ id: MOCK_RESTAURANT.id, name: MOCK_RESTAURANT.name }],
			loadError: error.message
		};
	}

	const restaurants = (data ?? []).map((r) => ({ id: r.id as string, name: r.name as string }));
	if (restaurants.length === 0) {
		restaurants.push({ id: MOCK_RESTAURANT.id, name: MOCK_RESTAURANT.name });
	}

	return { restaurants, loadError: null as string | null };
};
