import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Razorpay from 'razorpay';
import { env } from '$env/dynamic/private';
import crypto from 'crypto';

export const POST: RequestHandler = async ({ request, locals: { supabase } }) => {
	try {
		const rawBody = await request.text();
		const signature = request.headers.get('x-razorpay-signature');

		if (!signature) {
			return json({ error: 'Missing signature' }, { status: 400 });
		}

		const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET;
		
		if (webhookSecret) {
			// Verify signature
			const expectedSignature = crypto
				.createHmac('sha256', webhookSecret)
				.update(rawBody)
				.digest('hex');

			if (expectedSignature !== signature) {
				return json({ error: 'Invalid signature' }, { status: 400 });
			}
		} else {
			console.warn('RAZORPAY_WEBHOOK_SECRET is not set, skipping signature verification.');
		}

		const event = JSON.parse(rawBody);
		console.log('Razorpay Webhook Event Received:', event.event);

		// Handle specific events
		if (event.event === 'order.paid' || event.event === 'payment.captured') {
			const paymentEntity = event.payload.payment.entity;
			const orderId = paymentEntity.order_id;
			
			// Extract custom notes passed during order creation (e.g. our internal DB order_id)
			const internalOrderId = paymentEntity.notes?.internal_order_id;

			if (internalOrderId) {
				// Update the order in our database as 'paid'
				const { error } = await supabase
					.from('orders')
					.update({ payment_status: 'paid', status: 'preparing' })
					.eq('id', internalOrderId);
					
				if (error) {
					console.error('Failed to update order status:', error);
				}
			}
		} else if (event.event === 'transfer.processed') {
			// A transfer was processed to the linked account
			const transferEntity = event.payload.transfer.entity;
			console.log('Transfer processed to linked account:', transferEntity.recipient);
			
			// We could log this in a 'transfers' table if we had one for superadmin dashboard
		}

		return json({ status: 'ok' });
	} catch (err: any) {
		console.error('Razorpay Webhook Error:', err);
		return json({ error: err.message || 'Internal server error' }, { status: 500 });
	}
};
