import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params, locals: { supabase }, cookies }) => {
	const orderId = params.id;
	
	if (!orderId) {
		throw error(400, "Missing order ID");
	}

	// Verify the session to ensure only the customer who placed the order can see it.
	// In a real app with proper customer auth, we would verify a JWT or session cookie here.
	// For this PWA, we assume the client might pass a session token via headers or cookies if implemented.
	
	const { data: order, error: dbError } = await supabase
		.from("orders")
		.select("*, order_items(*, menu_item:menu_items(*))")
		.eq("id", orderId)
		.single();

	if (dbError || !order) {
		return json({ error: "Order not found" }, { status: 404 });
	}

	return json(order);
};
