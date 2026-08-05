/** Restaurant scope + UI density for superadmin shell */
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type SaDensity = 'card' | 'compact';

export type SaRestaurantOption = {
	id: string;
	name: string;
};

const DENSITY_KEY = 'sa_density';
const CONTEXT_KEY = 'sa_restaurant_id';

function readDensity(): SaDensity {
	if (!browser) return 'card';
	const v = localStorage.getItem(DENSITY_KEY);
	return v === 'compact' ? 'compact' : 'card';
}

function readContextId(): string | null {
	if (!browser) return null;
	return localStorage.getItem(CONTEXT_KEY);
}

export const saDensity = writable<SaDensity>(readDensity());
export const saRestaurantId = writable<string | null>(readContextId());
export const saRestaurants = writable<SaRestaurantOption[]>([]);

export function setSaDensity(d: SaDensity) {
	saDensity.set(d);
	if (browser) localStorage.setItem(DENSITY_KEY, d);
}

export function setSaRestaurantId(id: string | null) {
	saRestaurantId.set(id);
	if (browser) {
		if (id) localStorage.setItem(CONTEXT_KEY, id);
		else localStorage.removeItem(CONTEXT_KEY);
	}
}

export function tableDeepLink(restaurantId: string, tableId: string, origin?: string): string {
	const base = origin || (browser ? window.location.origin : '');
	return `${base}/table/${restaurantId}/${tableId}`;
}
