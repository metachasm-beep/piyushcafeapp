import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import crypto from 'crypto';
import { supabase } from '$lib/supabase';

const PAYU_KEY = 'XbZDpI';
const PAYU_SALT = '9poYXA6lRwo9gs7Dlrl2zGe5zCpZa47G';
const MASTER_MERCHANT_ID = 'MASTER_PAYU_123'; // Safely mocked

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { txnid, productinfo, firstname, email, udf1, udf2 } = body;

		// Fetch the calculated amounts from the orders table
		const { data: orderData, error: orderError } = await supabase
			.from('orders')
			.select('total_amount, platform_fee, restaurant_amount')
			.eq('id', txnid)
			.single();

		if (orderError || !orderData) {
			return json({ success: false, error: 'Order not found' }, { status: 404 });
		}

		// Fetch the restaurant's PayU sub-merchant ID
		const { data: restaurantData, error: restaurantError } = await supabase
			.from('restaurants')
			.select('payu_sub_merchant_id')
			.eq('id', udf1)
			.single();
			
		const subMerchantId = restaurantData?.payu_sub_merchant_id || 'MOCK_SUB_MERCHANT_456';
		const amount = orderData.total_amount.toString();
		const masterAmount = (Number(orderData.total_amount) - Number(orderData.restaurant_amount)).toFixed(2);
		const restaurantAmount = Number(orderData.restaurant_amount).toFixed(2);

		// Prepare Split Details JSON
		const childDetails = JSON.stringify({
			splitDetails: {
				[MASTER_MERCHANT_ID]: masterAmount,
				[subMerchantId]: restaurantAmount
			}
		});

		// Hash format: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT
		const hashString = `${PAYU_KEY}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1 || ''}|${udf2 || ''}||||||||${PAYU_SALT}`;
		
		const hash = crypto.createHash('sha512').update(hashString).digest('hex');

		return json({
			success: true,
			hash,
			key: PAYU_KEY,
			amount,
			childDetails
		});
	} catch (err) {
		console.error("PayU hash generation error:", err);
		return json({ success: false, error: 'Failed to generate hash' }, { status: 500 });
	}
};
