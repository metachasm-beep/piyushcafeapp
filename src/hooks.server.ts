import { createServerClient } from '@supabase/ssr';
import { env } from '$env/dynamic/public';
import { env as secretEnv } from '$env/dynamic/private';
import { redirect, type Handle, type HandleServerError } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const startTimer = performance.now();

	// 1. Initialize Supabase SSR
	event.locals.supabase = createServerClient(env.PUBLIC_SUPABASE_URL || '', env.PUBLIC_SUPABASE_ANON_KEY || '', {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookiesToSet) => {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, { ...options, path: '/' });
				});
			}
		}
	});

	// Safe session getter
	event.locals.safeGetSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();
		if (!session) return { session: null, user: null };

		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();
		if (error) {
			return { session: null, user: null };
		}
		return { session, user };
	};

	const { session, user } = await event.locals.safeGetSession();
	event.locals.session = session;
	event.locals.user = user;

	// 2. Global Security Guards
	const path = event.url.pathname;

	// Superadmin Guards
	if (path.startsWith('/superadmin') && !path.startsWith('/superadmin/login')) {
		if (!user) {
			throw redirect(303, '/superadmin/login');
		}
		// Strict constraint for metachasm@gmail.com
		if (user.email !== 'metachasm@gmail.com') {
			throw redirect(303, '/superadmin/login?error=unauthorized');
		}
	}

	// Owner Guards
	if (path.startsWith('/owner') && !path.startsWith('/owner/login')) {
		if (!user) {
			// Redirect to owner login (if it exists) or superadmin login for testing
			throw redirect(303, '/owner/login');
		}
		// Here we verify they are part of a restaurant (via restaurant_staff).
		// For high-level security, they must have a record in `restaurant_staff`.
		// To avoid a DB query on every request, we can check a custom claim or rely on the endpoints 
		// calling `security.ts`'s `requireAuth()`, but we can do a quick check here if needed.
		// For now, ensuring they are authenticated is the minimum.
	}

	// Table Guards
	// Table apps (`/table/*`) use anonymous or customer sessions. We do not block them here, 
	// but we ensure the Supabase client used in endpoints respects RLS.

	// 3. Resolve request
	const response = await resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});

	// 4. Observability
	const duration = performance.now() - startTimer;
	if (!path.startsWith('/_') && !path.startsWith('/src/')) {
		console.log(
			JSON.stringify({
				level: 'info',
				method: event.request.method,
				path,
				status: response.status,
				durationMs: duration.toFixed(2),
				timestamp: new Date().toISOString()
			})
		);
	}

	return response;
};

export const handleError: HandleServerError = ({ error, event, status }) => {
	const errorId = crypto.randomUUID();

	console.error(
		JSON.stringify({
			level: 'error',
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
		message: 'An unexpected error occurred. Our engineers have been notified.',
		errorId
	};
};
