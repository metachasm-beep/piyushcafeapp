import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';
import { get } from 'svelte/store';
import { adminUser } from '$lib/stores/admin';

export const ssr = false;

export const load: LayoutLoad = async ({ url }) => {
  const user = get(adminUser);
  if (!user && url.pathname !== '/admin/login') {
    redirect(302, '/admin/login');
  }
  return {};
};
