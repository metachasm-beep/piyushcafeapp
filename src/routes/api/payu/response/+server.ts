import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import crypto from 'crypto';
import { transitionOrderStatus } from '$lib/server/services/order.service';

const PAYU_KEY = 'XbZDpI';
const PAYU_SALT = '9poYXA6lRwo9gs7Dlrl2zGe5zCpZa47G';

export const POST: RequestHandler = async ({ request }) => {
	const formData = await request.formData();
	
	const status = formData.get('status')?.toString() || '';
	const txnid = formData.get('txnid')?.toString() || '';
	const amount = formData.get('amount')?.toString() || '';
	const productinfo = formData.get('productinfo')?.toString() || '';
	const firstname = formData.get('firstname')?.toString() || '';
	const email = formData.get('email')?.toString() || '';
	const udf1 = formData.get('udf1')?.toString() || '';
	const udf2 = formData.get('udf2')?.toString() || '';
	const responseHash = formData.get('hash')?.toString() || '';
	const additionalCharges = formData.get('additionalCharges')?.toString() || '';
	
	// Determine the hash string based on PayU documentation
	// Sequence: SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
	// Note: If additionalCharges is provided, it goes before SALT: additionalCharges|SALT|status|...
	
	let hashString = `${PAYU_SALT}|${status}|||||||${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${PAYU_KEY}`;
	if (additionalCharges) {
		hashString = `${additionalCharges}|${hashString}`;
	}
	
	const calculatedHash = crypto.createHash('sha512').update(hashString).digest('hex');
	
	let finalStatus = 'pending';
	
	// We verify the hash only if it's not a failure where hash might not match or be provided in some cases,
	// but generally we should verify if we want to change status to paid.
	if (status === 'success' && calculatedHash === responseHash) {
		// Update order status to paid
		try {
			await transitionOrderStatus(txnid, 'paid');
		} catch (e) {
			console.error('Failed to update order status to paid', e);
		}
	} else if (status === 'failure') {
		try {
			await transitionOrderStatus(txnid, 'cancelled');
		} catch (e) {
			console.error('Failed to update order status to cancelled', e);
		}
	} else {
		console.error('Hash mismatch or unknown status', { status, calculatedHash, responseHash });
	}

	// Redirect back to the order page
	throw redirect(303, `/table/${udf1}/${udf2}/order`);
};
