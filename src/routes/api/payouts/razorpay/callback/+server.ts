import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals: { supabase, getSession } }) => {
	const code = url.searchParams.get('code');
	
	if (!code) {
		throw redirect(302, '/owner/payouts?error=missing_code');
	}

	const session = await getSession();
	if (!session) throw redirect(302, '/owner/login');

	// Get user's restaurant_id
	const { data: staffData } = await supabase
		.from('restaurant_staff')
		.select('restaurant_id')
		.eq('user_id', session.user.id)
		.single();

	if (!staffData) throw redirect(302, '/owner/payouts?error=no_restaurant');

	// In production, exchange the `code` for a token/account_id via Razorpay OAuth API:
	// POST https://api.razorpay.com/v1/applications/token
	const mockAccountId = 'acc_RzpMock' + Math.floor(Math.random() * 100000);

	// Save to database
	await supabase
		.from('restaurants')
		.update({ razorpay_account_id: mockAccountId })
		.eq('id', staffData.restaurant_id);

	throw redirect(302, '/owner/payouts?success=razorpay_connected');
};
