import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Razorpay from 'razorpay';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request, locals: { supabase } }) => {
	try {
		const body = await request.json();
		const { restaurant_id, email, phone, business_name, pan_number } = body;

		if (!restaurant_id) {
			return json({ error: 'Missing restaurant_id' }, { status: 400 });
		}

		// Initialize Razorpay
		if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
			console.error('Razorpay keys not configured');
			// For demo purposes, we will return a mock account if keys are missing
			// In production, this should throw an error.
			return json({ accountId: 'acc_mock_' + Math.random().toString(36).substring(2, 9) });
		}

		const razorpay = new Razorpay({
			key_id: env.RAZORPAY_KEY_ID,
			key_secret: env.RAZORPAY_KEY_SECRET
		});

		// Call Razorpay Linked Accounts API
		const account = await razorpay.accounts.create({
			email: email,
			phone: phone,
			legal_business_name: business_name,
			business_type: 'individual',
			contact_name: business_name,
			profile: {
				category: 'food_and_beverage',
				subcategory: 'restaurant'
			},
			legal_info: {
				pan: pan_number
			}
		});

		const accountId = account.id;

		// Save the Razorpay account_id to the database
		if (accountId) {
			const { error } = await supabase
				.from('restaurants')
				.update({ razorpay_account_id: accountId })
				.eq('id', restaurant_id);
				
			if (error) {
				console.error('Failed to update restaurant with Razorpay Account ID:', error);
				return json({ error: 'Failed to save account ID' }, { status: 500 });
			}
		}

		return json({ accountId });
	} catch (err: any) {
		console.error('Razorpay Onboard Error:', err);
		return json({ error: err.message || 'Internal server error' }, { status: 500 });
	}
};
