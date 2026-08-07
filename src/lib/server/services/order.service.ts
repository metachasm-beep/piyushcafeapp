/**
 * order.service.ts
 * Service layer for all order lifecycle operations.
 * Applies: backend-architect, saga-orchestration, error-handling-patterns
 */
import { supabase } from "$lib/supabase";
import { sanitizeObject, type OrderInput } from "$lib/server/security";

export type OrderStatus = "pending" | "preparing" | "ready" | "served" | "paid" | "cancelled";

// Valid state machine transitions  prevents illegal status changes
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
	pending:    ["preparing", "paid", "cancelled"],
	preparing:  ["ready", "paid", "cancelled"],
	ready:      ["served", "paid"],
	served:     ["paid"],
	paid:       [],
	cancelled:  []
};

// =============================================
// CREATE ORDER (Saga Pattern: atomic insert)
// =============================================

export async function placeOrder(input: OrderInput): Promise<{ id: string }> {
	const sanitized = sanitizeObject(input as unknown as Record<string, unknown>) as unknown as OrderInput;

	if (!supabase) {
		throw new Error("Supabase not initialized");
	}

	// Call the atomic RPC to place the order
	const { data: orderId, error } = await supabase.rpc("place_order", {
		p_restaurant_id: sanitized.restaurant_id,
		p_table_id: sanitized.table_id,
		p_special_instructions: sanitized.special_instructions ?? "",
		p_items: sanitized.items.map(item => ({
			menu_item_id: item.menu_item_id,
			quantity: item.quantity,
			variation_id: item.variation_id ?? null,
			addon_ids: item.addon_ids ?? [],
			special_instructions: item.special_instructions ?? ""
		}))
	});

	if (error || !orderId) {
		console.error(JSON.stringify({ level: "error", context: "placeOrder:rpc", msg: error?.message }));
		throw new Error("Failed to create order.");
	}

	console.log(JSON.stringify({ level: "info", msg: "Order placed successfully via RPC", orderId }));
	return { id: orderId };
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
