import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

export const ssr = false;

export const load: LayoutLoad = async ({ parent, url }) => {
  // Get session data from the server-side layout (hooks.server.ts sets user)
  const data = await parent();

  // If no Supabase session, redirect to main login page
  // (The server-side hooks already handle the real auth guards,
  // but we keep this client-side check so the page doesn't flash)
  if (!(data as any).session && url.pathname !== '/auth/login') {
    redirect(302, '/');
  }

  return {};
};
