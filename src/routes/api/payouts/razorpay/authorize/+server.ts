import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	// In production, you would redirect to:
	// https://auth.razorpay.com/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=YOUR_CALLBACK_URL&state=xyz
	
	// For this mock, we redirect directly back to our callback with a dummy code
	const callbackUrl = new URL('/api/payouts/razorpay/callback', url.origin);
	callbackUrl.searchParams.set('code', 'mock_rzp_auth_code_123');
	callbackUrl.searchParams.set('state', 'mock_state');
	
	throw redirect(302, callbackUrl.toString());
};
