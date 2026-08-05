/**
 * /api/orders � REST endpoint for the Customer app.
 * Applies: api-design-principles, backend-security-coder, nodejs-backend-patterns
 */
import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { OrderSchema } from "$lib/server/security";
import { placeOrder } from "$lib/server/services/order.service";

// POST /api/orders � place a new order
export const POST: RequestHandler = async ({ request }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		throw error(400, "Invalid JSON body.");
	}

	const parsed = OrderSchema.safeParse(body);
	if (!parsed.success) {
		return json(
			{ success: false, errors: parsed.error.flatten().fieldErrors },
			{ status: 422 }
		);
	}

	try {
		const order = await placeOrder(parsed.data);
		return json({ success: true, orderId: order.id }, { status: 201 });
	} catch (e) {
		const msg = e instanceof Error ? e.message : "Internal server error";
		return json({ success: false, error: msg }, { status: 500 });
	}
};

// GET /api/orders/:id � not implemented via this route, 405
export const GET: RequestHandler = async () => {
	throw error(405, "Method Not Allowed. Use GET /api/orders/{id} when implemented.");
};
