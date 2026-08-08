import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Razorpay from 'razorpay';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request, locals: { supabase } }) => {
	try {
		const body = await request.json();
		const { restaurant_id, email, phone, business_name, pan_number, beneficiary_name, account_number, ifsc_code } = body;

		if (!restaurant_id) {
			return json({ error: 'Missing restaurant_id' }, { status: 400 });
		}

		// Initialize Razorpay
		if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
			console.error('Razorpay keys not configured');
			return json({ error: 'Payment gateway not configured' }, { status: 500 });
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
			},
			// Bank details for settlements
			// Note: The exact structure might vary based on Razorpay Route version, but typically it can be added here or via an update call
			notes: {
				beneficiary_name: beneficiary_name,
				account_number: account_number,
				ifsc_code: ifsc_code
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
