import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';
import { adminUser } from '$lib/stores/admin';

export const ssr = false;

const PUBLIC_PATHS = ['/owner/login', '/owner/auth/callback'];

export const load: LayoutLoad = async ({ url }) => {
  const user = await adminUser.init();
  const isPublic = PUBLIC_PATHS.some((p) => url.pathname === p || url.pathname.startsWith(p + '/'));

  if (!user && !isPublic) {
    redirect(302, '/owner/login');
  }

  // Already signed in — skip login screen
  if (user && url.pathname === '/owner/login') {
    redirect(302, '/owner');
  }

  return {};
};
