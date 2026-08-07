import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Razorpay from 'razorpay';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request, locals: { supabase } }) => {
	try {
		const body = await request.json();
		const { amount, restaurant_id, receipt, notes } = body;

		if (!amount || !restaurant_id) {
			return json({ error: 'Missing required parameters' }, { status: 400 });
		}

		// Initialize Razorpay
		if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
			console.error('Razorpay keys not configured');
			// Return a mock order if keys are missing for demo purposes
			return json({ 
				id: 'order_mock_' + Math.random().toString(36).substring(2, 9),
				amount: Math.round(amount * 100),
				currency: 'INR'
			});
		}

		const razorpay = new Razorpay({
			key_id: env.RAZORPAY_KEY_ID,
			key_secret: env.RAZORPAY_KEY_SECRET
		});

		// Fetch restaurant details to get the linked account ID
		const { data: restaurant, error } = await supabase
			.from('restaurants')
			.select('razorpay_account_id')
			.eq('id', restaurant_id)
			.single();

		if (error || !restaurant) {
			return json({ error: 'Restaurant not found' }, { status: 404 });
		}

		const linkedAccountId = restaurant.razorpay_account_id;

		// The amount is received in INR, we need to convert to paisa
		const amountInPaisa = Math.round(amount * 100);

		// Calculate Split (example calculation based on requirements)
		// Assuming amount = food + 5% GST
		// Food = amount / 1.05
		const foodAmount = amount / 1.05;
		
		// Platform fee = 2% of food
		const platformFee = foodAmount * 0.02;
		
		// GST on platform fee = 18% of platform fee
		const gstOnPlatformFee = platformFee * 0.18;
		
		// Total deducted by superadmin
		const superAdminDeduction = platformFee + gstOnPlatformFee;
		
		// Restaurant amount
		const restaurantAmount = amount - superAdminDeduction;
		const restaurantAmountInPaisa = Math.round(restaurantAmount * 100);

		// Razorpay expects transfers array if splitting
		const transfers = linkedAccountId ? [
			{
				account: linkedAccountId,
				amount: restaurantAmountInPaisa,
				currency: 'INR',
				notes: {
					branch: restaurant_id,
					type: 'restaurant_settlement'
				},
				linked_account_notes: ['branch'],
				on_hold: 0
			}
		] : undefined;

		const orderOptions: any = {
			amount: amountInPaisa,
			currency: 'INR',
			receipt: receipt || `receipt_${Date.now()}`,
			notes: notes || {}
		};

		if (transfers && transfers.length > 0) {
			orderOptions.transfers = transfers;
		}

		const order = await razorpay.orders.create(orderOptions);

		return json({
			id: order.id,
			amount: order.amount,
			currency: order.currency,
			key: env.RAZORPAY_KEY_ID
		});

	} catch (err: any) {
		console.error('Razorpay Order Error:', err);
		return json({ error: err.message || 'Internal server error' }, { status: 500 });
	}
};
