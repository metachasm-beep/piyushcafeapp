import type { Handle, HandleServerError } from "@sveltejs/kit";

// 1. Observability & Monitoring
export const handle: Handle = async ({ event, resolve }) => {
	const startTimer = performance.now();

	const response = await resolve(event);

	const endTimer = performance.now();
	const duration = endTimer - startTimer;

	// Structured logging for observability (skip internal SvelteKit paths)
	if (!event.url.pathname.startsWith("/_") && !event.url.pathname.startsWith("/src/")) {
		console.log(
			JSON.stringify({
				level: "info",
				method: event.request.method,
				path: event.url.pathname,
				status: response.status,
				durationMs: duration.toFixed(2),
				timestamp: new Date().toISOString()
			})
		);
	}

	return response;
};

// 2. Global Error Handling � never leaks stack traces to the client
export const handleError: HandleServerError = ({ error, event, status }) => {
	const errorId = crypto.randomUUID();

	console.error(
		JSON.stringify({
			level: "error",
			errorId,
			path: event.url.pathname,
			method: event.request.method,
			status,
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			timestamp: new Date().toISOString()
		})
	);

	return {
		message: "An unexpected error occurred. Our engineers have been notified.",
		errorId
	};
};
