import { supabase } from "$lib/supabase";
import { sanitizeObject, type CustomerFeedbackInput } from "$lib/server/security";

export async function submitFeedback(input: CustomerFeedbackInput) {
	const sanitized = sanitizeObject(input as unknown as Record<string, unknown>) as unknown as CustomerFeedbackInput;

	if (!supabase) {
		throw new Error("Supabase not initialized");
	}

	const { data, error } = await supabase
		.from("customer_feedback")
		.insert([{
			restaurant_id: sanitized.restaurant_id,
			table_id: sanitized.table_id,
			order_id: sanitized.order_id,
			rating: sanitized.rating,
			comment: sanitized.comment ?? null
		}])
		.select('id')
		.single();

	if (error || !data) {
		console.error(JSON.stringify({ level: "error", context: "submitFeedback", msg: error?.message }));
		throw new Error("Failed to submit feedback.");
	}

	console.log(JSON.stringify({ level: "info", msg: "Feedback submitted", feedbackId: data.id }));
	return { success: true };
}
