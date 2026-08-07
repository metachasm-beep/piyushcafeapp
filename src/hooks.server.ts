import { createServerClient } from '@supabase/ssr';
import { env } from '$env/dynamic/public';
import { env as secretEnv } from '$env/dynamic/private';
import { redirect, type Handle, type HandleServerError } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const startTimer = performance.now();

	// 0. Domain Enforcement
	const host = event.request.headers.get('host');
	if (host && !host.includes('localhost') && host !== 'thegoldenfork.vercel.app') {
		return new Response(null, {
			status: 301,
			headers: {
				Location: 'https://thegoldenfork.vercel.app' + event.url.pathname + event.url.search
			}
		});
	}

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
	const routeId = event.route.id || '';

	const SUPERADMIN_EMAIL = 'metachasm@gmail.com';

	// Global Login Enforcement (if logged in, MUST be superadmin or approved owner)
	if (user && user.email) {
		const email = user.email.toLowerCase();
		if (email !== SUPERADMIN_EMAIL) {
			const { data: profile } = await event.locals.supabase
				.from('owner_profiles')
				.select('is_approved')
				.eq('id', user.id)
				.single();

			if (!profile || !profile.is_approved) {
				await event.locals.supabase.auth.signOut();
				// clear user/session in locals
				event.locals.session = null;
				event.locals.user = null;
				if (path !== '/' && !path.startsWith('/auth/')) {
					throw redirect(303, '/?error=unauthorized');
				}
			}
		}
	}

	// Superadmin Guards
	if (routeId.startsWith('/superadmin')) {
		if (!user) {
			throw redirect(303, '/');
		}
		
		if (!user.email || user.email.toLowerCase() !== SUPERADMIN_EMAIL) {
			throw redirect(303, '/?error=unauthorized');
		}
	}

	// Owner Guards
	if (routeId.startsWith('/owner')) {
		if (!event.locals.user) {
			throw redirect(303, '/');
		}
	}

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
