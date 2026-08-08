import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	// In production, you would redirect to PayPal Partner onboarding
	
	// For this mock, we redirect directly back to our callback with a dummy code
	const callbackUrl = new URL('/api/payouts/paypal/callback', url.origin);
	callbackUrl.searchParams.set('code', 'mock_paypal_auth_code_789');
	
	throw redirect(302, callbackUrl.toString());
};
