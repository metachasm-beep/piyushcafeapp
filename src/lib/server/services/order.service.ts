/**
 * order.service.ts
 * Service layer for all order lifecycle operations.
 * Applies: backend-architect, saga-orchestration, error-handling-patterns
 */
import { supabase } from "$lib/supabase";
import { sanitizeObject, type OrderInput } from "$lib/server/security";

export type OrderStatus = "pending" | "preparing" | "ready" | "served" | "cancelled";

// Valid state machine transitions � prevents illegal status changes
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
	pending:    ["preparing", "cancelled"],
	preparing:  ["ready", "cancelled"],
	ready:      ["served"],
	served:     [],
	cancelled:  []
};

// =============================================
// CREATE ORDER (Saga Pattern: atomic insert)
// =============================================

export async function placeOrder(input: OrderInput): Promise<{ id: string }> {
	const sanitized = sanitizeObject(input as unknown as Record<string, unknown>) as unknown as OrderInput;

	if (!supabase) {
		const mockId = `mock_${crypto.randomUUID()}`;
		console.log(JSON.stringify({ level: "warn", msg: "Mock mode: order not persisted", mockId }));
		return { id: mockId };
	}

	// Step 1: Calculate total_amount server-side (never trust the client total)
	const total_amount = sanitized.items.reduce((sum, item) => sum + item.subtotal, 0);

	// Step 2: Insert order header
	const { data: order, error: orderError } = await supabase
		.from("orders")
		.insert({
			restaurant_id: sanitized.restaurant_id,
			table_id: sanitized.table_id,
			special_instructions: sanitized.special_instructions ?? "",
			total_amount,
			status: "pending",
			is_paid: false
		})
		.select("id")
		.single();

	if (orderError || !order) {
		console.error(JSON.stringify({ level: "error", context: "placeOrder:header", msg: orderError?.message }));
		throw new Error("Failed to create order.");
	}

	// Step 3: Insert order items in bulk
	const orderItems = sanitized.items.map((item) => ({
		order_id: order.id,
		menu_item_id: item.menu_item_id,
		quantity: item.quantity,
		subtotal: item.subtotal
	}));

	const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

	if (itemsError) {
		// Compensating action: delete the orphaned order header
		console.error(JSON.stringify({ level: "error", context: "placeOrder:items", msg: itemsError.message, orderId: order.id }));
		await supabase.from("orders").delete().eq("id", order.id);
		throw new Error("Failed to add items to order. Order has been rolled back.");
	}

	console.log(JSON.stringify({ level: "info", msg: "Order placed successfully", orderId: order.id }));
	return { id: order.id };
}

// =============================================
// STATUS TRANSITIONS (State Machine)
// =============================================

export async function transitionOrderStatus(orderId: string, nextStatus: OrderStatus): Promise<void> {
	if (!supabase) return;

	// Fetch current status first
	const { data: current, error: fetchError } = await supabase
		.from("orders")
		.select("status")
		.eq("id", orderId)
		.single();

	if (fetchError || !current) {
		throw new Error(`Order ${orderId} not found.`);
	}

	const currentStatus = current.status as OrderStatus;
	const allowed = VALID_TRANSITIONS[currentStatus];

	if (!allowed.includes(nextStatus)) {
		console.error(JSON.stringify({
			level: "error",
			context: "transitionOrderStatus",
			msg: `Illegal transition: ${currentStatus} ? ${nextStatus}`,
			orderId
		}));
		throw new Error(`Cannot move order from "${currentStatus}" to "${nextStatus}".`);
	}

	const { error: updateError } = await supabase
		.from("orders")
		.update({ status: nextStatus })
		.eq("id", orderId);

	if (updateError) {
		throw new Error("Failed to update order status.");
	}

	console.log(JSON.stringify({ level: "info", msg: `Order ${orderId}: ${currentStatus} ? ${nextStatus}` }));
}

// =============================================
// FETCH ORDERS
// =============================================

export async function fetchOrdersForRestaurant(restaurantId: string) {
	if (!supabase) return [];

	// Uses composite index: idx_orders_restaurant_status
	const { data, error } = await supabase
		.from("orders")
		.select("*, order_items(*)")
		.eq("restaurant_id", restaurantId)
		.neq("status", "served")
		.order("created_at", { ascending: true });

	if (error) {
		console.error(JSON.stringify({ level: "error", context: "fetchOrdersForRestaurant", msg: error.message }));
		throw new Error("Failed to fetch orders.");
	}
	return data ?? [];
}
