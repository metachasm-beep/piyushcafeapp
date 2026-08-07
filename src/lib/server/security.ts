import { error } from "@sveltejs/kit";
import { z } from "zod";
import type { RequestEvent } from "@sveltejs/kit";

// =============================================
// Role Verification (server-side guard)
// =============================================

export function requireAuth(event: RequestEvent): string {
	const userId = (event.locals as any)?.session?.user?.id;
	if (!userId) {
		throw error(401, "Unauthorized: You must be signed in.");
	}
	return userId;
}

// =============================================
// Input Sanitization
// =============================================

/** Strip any HTML tags to prevent XSS stored in the DB */
export function sanitizeString(input: string): string {
	return input.replace(/<[^>]*>?/gm, "").trim();
}

/** Sanitize all string fields of an object recursively */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
	const result = { ...obj };
	for (const key in result) {
		const val = result[key];
		if (typeof val === "string") {
			(result as Record<string, unknown>)[key] = sanitizeString(val);
		}
	}
	return result;
}

// =============================================
// Zod Schemas for Validated Input
// =============================================

export const MenuItemSchema = z.object({
	name: z.string().min(1, "Name is required").max(120),
	description: z.string().max(500).optional().default(""),
	price: z.coerce.number().positive("Price must be positive"),
	image_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
	category_id: z.string().uuid("Invalid category ID").optional().nullable(),
	is_available: z.coerce.boolean().default(true),
	dietary_tags: z.array(z.string()).default([]),
	happy_hour_discount: z.coerce.number().min(0).max(100).optional().default(0),
	restaurant_id: z.string().uuid("Invalid restaurant ID")
});

export const TableSchema = z.object({
	table_number: z.coerce.number().int().positive("Table number must be a positive integer"),
	display_name: z.string().max(60).optional().nullable(),
	capacity: z.coerce.number().int().min(1).max(50).default(4),
	restaurant_id: z.string().uuid("Invalid restaurant ID")
});

export const OrderSchema = z.object({
	restaurant_id: z.string().uuid(),
	table_id: z.string().uuid(),
	special_instructions: z.string().max(500).optional().default(""),
	items: z
		.array(
			z.object({
				menu_item_id: z.string().uuid(),
				quantity: z.coerce.number().int().min(1).max(99),
				variation_id: z.string().uuid().optional().nullable(),
				addon_ids: z.array(z.string().uuid()).optional(),
				special_instructions: z.string().max(500).optional()
			})
		)
		.min(1, "Order must have at least one item")
});

export const CustomerFeedbackSchema = z.object({
	restaurant_id: z.string().uuid(),
	table_id: z.string().uuid(),
	order_id: z.string().uuid(),
	rating: z.coerce.number().int().min(1).max(5),
	comment: z.string().max(1000).optional().nullable()
});

export type MenuItemInput = z.infer<typeof MenuItemSchema>;
export type TableInput = z.infer<typeof TableSchema>;
export type OrderInput = z.infer<typeof OrderSchema>;
export type CustomerFeedbackInput = z.infer<typeof CustomerFeedbackSchema>;
