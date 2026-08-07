import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { supabase, user, restaurantId } = locals;
	if (!user || !restaurantId) {
		throw error(401, 'Unauthorized');
	}

	// 1. Fetch Waiter profile
	const { data: staffData, error: staffError } = await supabase
		.from('restaurant_staff')
		.select('*')
		.eq('user_id', user.id)
		.eq('restaurant_id', restaurantId)
		.single();

	if (staffError) {
		throw error(500, 'Failed to fetch staff data');
	}

	// 2. Fetch Assigned Orders
	const { data: assignedOrders, error: ordersError } = await supabase
		.from('orders')
		.select('*, table:tables(*)')
		.eq('restaurant_id', restaurantId)
		.eq('assigned_waiter_id', staffData.id)
		.neq('status', 'paid')
		.neq('status', 'cancelled')
		.order('created_at', { ascending: false });

	if (ordersError) {
		console.error('Failed to fetch assigned orders:', ordersError);
	}

	// 3. Fetch Assigned Waiter Requests
	const { data: assignedRequests, error: requestsError } = await supabase
		.from('waiter_requests')
		.select('*, table:tables(*)')
		.eq('restaurant_id', restaurantId)
		.eq('assigned_waiter_id', staffData.id)
		.eq('status', 'pending')
		.order('created_at', { ascending: false });
		
	if (requestsError) {
		console.error('Failed to fetch assigned requests:', requestsError);
	}

	return {
		staff: staffData,
		assignedOrders: assignedOrders || [],
		assignedRequests: assignedRequests || []
	};
};

export const actions = {
	toggleAvailability: async ({ request, locals }) => {
		const { supabase, user, restaurantId } = locals;
		if (!user || !restaurantId) {
			return { success: false, message: 'Unauthorized' };
		}

		const data = await request.formData();
		const isAvailable = data.get('is_available') === 'true';

		const { error: updateError } = await supabase
			.from('restaurant_staff')
			.update({ is_available: isAvailable })
			.eq('user_id', user.id)
			.eq('restaurant_id', restaurantId);

		if (updateError) {
			console.error('Failed to update availability:', updateError);
			return { success: false, message: 'Failed to update availability' };
		}

		return { success: true, is_available: isAvailable };
	},
	resolveRequest: async ({ request, locals }) => {
		const { supabase, user, restaurantId } = locals;
		if (!user || !restaurantId) {
			return { success: false, message: 'Unauthorized' };
		}

		const data = await request.formData();
		const requestId = data.get('request_id')?.toString();

		if (!requestId) return { success: false, message: 'Invalid request' };

		const { error: updateError } = await supabase
			.from('waiter_requests')
			.update({ status: 'resolved', resolved_at: new Date().toISOString() })
			.eq('id', requestId)
			.eq('restaurant_id', restaurantId);

		if (updateError) {
			console.error('Failed to resolve request:', updateError);
			return { success: false, message: 'Failed to resolve request' };
		}

		return { success: true };
	}
};
