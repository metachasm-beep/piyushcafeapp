import { error } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	updateOrderStatus: async ({ request, locals }) => {
		const { supabase, user, restaurantId } = locals;
		
		if (!user || !restaurantId) {
			return { success: false, message: 'Unauthorized' };
		}

		const data = await request.formData();
		const orderId = data.get('order_id')?.toString();
		const status = data.get('status')?.toString();

		if (!orderId || !status) {
			return { success: false, message: 'Missing order_id or status' };
		}

		const { error: updateError } = await supabase
			.from('orders')
			.update({ status, updated_at: new Date().toISOString() })
			.eq('id', orderId)
			.eq('restaurant_id', restaurantId);

		if (updateError) {
			console.error('Failed to update order status:', updateError);
			return { success: false, message: 'Failed to update order status' };
		}

		return { success: true };
	}
};
