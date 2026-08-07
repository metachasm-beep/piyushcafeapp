import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { z } from 'zod';
import type { RequestHandler } from './$types';

const ContactSchema = z.object({
	name: z.string().trim().min(1, 'Name is required').max(120),
	email: z.string().trim().email('Valid email is required').max(200),
	phone: z.string().trim().min(7, 'Phone is required').max(40),
	restaurant: z.string().trim().min(1, 'Restaurant is required').max(160),
	city: z.string().trim().max(120).optional().default(''),
	interest: z.enum(['platform_fee', 'subscription', 'not_sure']).default('not_sure'),
	message: z.string().trim().max(2000).optional().default('')
});

const INTEREST_LABELS: Record<z.infer<typeof ContactSchema>['interest'], string> = {
	platform_fee: 'Platform fee (2%)',
	subscription: 'Monthly subscription',
	not_sure: 'Not sure yet'
};

export const POST: RequestHandler = async ({ request }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
	}

	const parsed = ContactSchema.safeParse(body);
	if (!parsed.success) {
		const first =
			Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? 'Invalid form data.';
		return json({ success: false, error: first }, { status: 422 });
	}

	const webhook = env.CONTACT_SHEETS_WEBHOOK_URL?.trim();
	if (!webhook) {
		console.error('CONTACT_SHEETS_WEBHOOK_URL is not configured');
		return json(
			{ success: false, error: 'Contact form is temporarily unavailable. Please try again later.' },
			{ status: 503 }
		);
	}

	const payload = {
		timestamp: new Date().toISOString(),
		name: parsed.data.name,
		email: parsed.data.email,
		phone: parsed.data.phone,
		restaurant: parsed.data.restaurant,
		city: parsed.data.city,
		interest: INTEREST_LABELS[parsed.data.interest],
		message: parsed.data.message
	};

	try {
		const res = await fetch(webhook, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
			redirect: 'follow'
		});

		if (!res.ok) {
			const text = await res.text().catch(() => '');
			console.error('Sheets webhook failed', res.status, text.slice(0, 500));
			return json(
				{ success: false, error: 'Could not save your message. Please try again.' },
				{ status: 502 }
			);
		}

		return json({ success: true }, { status: 201 });
	} catch (e) {
		console.error('Sheets webhook error', e);
		return json(
			{ success: false, error: 'Could not save your message. Please try again.' },
			{ status: 502 }
		);
	}
};
