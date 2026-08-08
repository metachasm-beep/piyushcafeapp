import { createServerClient } from '@supabase/ssr';
import { env } from '$env/dynamic/public';
import { env as secretEnv } from '$env/dynamic/private';
import { redirect, type Handle, type HandleServerError } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const startTimer = performance.now();

	// 0. Domain Enforcement removed to avoid redirect loops on vercel aliases

	// 1. Initialize Supabase SSR (skip when env is missing so marketing pages still render)
	const supabaseUrl = env.PUBLIC_SUPABASE_URL?.trim();
	const supabaseAnonKey = env.PUBLIC_SUPABASE_ANON_KEY?.trim();
	const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

	if (supabaseConfigured) {
		event.locals.supabase = createServerClient(supabaseUrl!, supabaseAnonKey!, {
			cookies: {
				getAll: () => event.cookies.getAll(),
				setAll: (cookiesToSet) => {
					cookiesToSet.forEach(({ name, value, options }) => {
						event.cookies.set(name, value, { ...options, path: '/' });
					});
				}
			}
		});
	} else {
		// Minimal stub — public marketing / contact routes do not need auth
		event.locals.supabase = null as unknown as typeof event.locals.supabase;
	}

	// Safe session getter
	event.locals.safeGetSession = async () => {
		if (!supabaseConfigured || !event.locals.supabase) {
			return { session: null, user: null };
		}

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

	// Allow public access to debug endpoint for troubleshooting
	if (path.startsWith('/api/debug-owner')) {
		return resolve(event);
	}

	// Global Login Enforcement (if logged in, MUST be superadmin, approved owner, or staff)
	if (user && user.email) {
		const email = user.email.toLowerCase();
		if (email !== SUPERADMIN_EMAIL) {
			// First check if they are restaurant staff
			const { data: staffData } = await event.locals.supabase
				.from('restaurant_staff')
				.select('role, restaurant_id')
				.eq('user_id', user.id)
				.single();

			if (staffData) {
				event.locals.userRole = staffData.role;
				event.locals.restaurantId = staffData.restaurant_id;
			} else {
				// Fallback to legacy owner_profiles just in case
				const { data: profile } = await event.locals.supabase
					.from('owner_profiles')
					.select('is_approved, restaurant_name')
					.eq('id', user.id)
					.single();

				if (!profile || !profile.is_approved) {
					// User is not an approved owner, deny access
					await event.locals.supabase.auth.signOut();
					event.locals.session = null;
					event.locals.user = null;
					if (path !== '/login' && !path.startsWith('/auth/') && path !== '/') {
						throw redirect(303, '/login?error=unauthorized');
					}
				} else {
					event.locals.userRole = 'owner';
				}
			}
		}
	}

	// Superadmin Guards
	if (routeId.startsWith('/superadmin')) {
		if (!user) {
			throw redirect(303, '/login');
		}

		if (!user.email || user.email.toLowerCase() !== SUPERADMIN_EMAIL) {
			throw redirect(303, '/login?error=unauthorized');
		}
	}

	// Owner / Staff Guards
	if (routeId.startsWith('/owner')) {
		if (!event.locals.user) {
			throw redirect(303, '/login');
		}

		const role = event.locals.userRole;

		if (role === 'chef') {
			// Chefs can only access kitchen
			if (!path.startsWith('/owner/kitchen') && !path.startsWith('/owner/settings')) {
				throw redirect(303, '/owner/kitchen');
			}
		} else if (role === 'waiter') {
			// Waiters can only access waiter dashboard
			if (!path.startsWith('/owner/waiter') && !path.startsWith('/owner/settings')) {
				throw redirect(303, '/owner/waiter');
			}
		} else if (role === 'owner' || !role) {
			// Owners or approved users with no staff role yet — allow access
			// No restrictions for owners
		} else {
			// Unrecognized role
			throw redirect(303, '/login?error=unauthorized');
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
