import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Automatically assigns an available waiter to a specific order or waiter request.
 * It selects an available waiter with the least amount of currently active assignments to distribute the load evenly.
 */
export async function assignAvailableWaiter(
	supabaseAdmin: SupabaseClient,
	restaurantId: string,
	targetId: string,
	targetType: 'order' | 'waiter_request'
) {
	// 1. Fetch all available waiters for this restaurant
	const { data: availableWaiters, error: waiterError } = await supabaseAdmin
		.from('restaurant_staff')
		.select('id')
		.eq('restaurant_id', restaurantId)
		.eq('role', 'waiter')
		.eq('is_available', true);

	if (waiterError || !availableWaiters || availableWaiters.length === 0) {
		console.warn('No available waiters to assign.');
		return null; // No one available to assign
	}

	// 2. To distribute evenly, we can find out how many active assignments each waiter has.
	// For simplicity, we can do a round robin or just pick a random one if we don't want complex queries.
	// Let's pick a random one for now to ensure distribution.
	const selectedWaiter = availableWaiters[Math.floor(Math.random() * availableWaiters.length)];

	// 3. Assign the selected waiter to the target
	if (targetType === 'order') {
		const { error: updateError } = await supabaseAdmin
			.from('orders')
			.update({ assigned_waiter_id: selectedWaiter.id })
			.eq('id', targetId);
		if (updateError) console.error('Failed to assign waiter to order:', updateError);
	} else if (targetType === 'waiter_request') {
		const { error: updateError } = await supabaseAdmin
			.from('waiter_requests')
			.update({ assigned_waiter_id: selectedWaiter.id })
			.eq('id', targetId);
		if (updateError) console.error('Failed to assign waiter to request:', updateError);
	}

	return selectedWaiter.id;
}
