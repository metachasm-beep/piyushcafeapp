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

	// In production, exchange the `code` for a PayPal Merchant ID via API
	const mockAccountId = 'acct_PayPMock' + Math.floor(Math.random() * 100000);

	// Save to database
	await supabase
		.from('restaurants')
		.update({ paypal_account_id: mockAccountId })
		.eq('id', staffData.restaurant_id);

	throw redirect(302, '/owner/payouts?success=paypal_connected');
};
