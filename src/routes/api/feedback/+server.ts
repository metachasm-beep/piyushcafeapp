import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { CustomerFeedbackSchema } from "$lib/server/security";
import { submitFeedback } from "$lib/server/services/feedback.service";

export const POST: RequestHandler = async ({ request }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		throw error(400, "Invalid JSON body.");
	}

	const parsed = CustomerFeedbackSchema.safeParse(body);
	if (!parsed.success) {
		return json(
			{ success: false, errors: parsed.error.flatten().fieldErrors },
			{ status: 422 }
		);
	}

	try {
		await submitFeedback(parsed.data);
		return json({ success: true }, { status: 201 });
	} catch (e) {
		const msg = e instanceof Error ? e.message : "Internal server error";
		return json({ success: false, error: msg }, { status: 500 });
	}
};
