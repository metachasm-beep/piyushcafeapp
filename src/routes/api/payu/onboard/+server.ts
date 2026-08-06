import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabase';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { restaurant_id, pan_number, aadhar_number, account_number, ifsc_code } = body;

		if (!restaurant_id || !pan_number || !aadhar_number || !account_number || !ifsc_code) {
			return json({ success: false, error: 'Missing required fields' }, { status: 400 });
		}

		// Mock PayU Partner/Marketplace API call
		// In a real scenario, this would send KYC documents to PayU and receive a sub_merchant_id.
		const mockSubMerchantId = `PAYU_SUB_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

		// Update the restaurant record with the new sub-merchant ID
		if (supabase) {
			const { error } = await supabase
				.from('restaurants')
				.update({ payu_sub_merchant_id: mockSubMerchantId })
				.eq('id', restaurant_id);

			if (error) {
				console.error('Failed to update restaurant:', error);
				return json({ success: false, error: 'Database update failed' }, { status: 500 });
			}
		}

		return json({
			success: true,
			subMerchantId: mockSubMerchantId
		});
	} catch (err) {
		console.error("PayU onboarding error:", err);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};
