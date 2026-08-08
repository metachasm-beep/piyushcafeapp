import type { LayoutLoad } from './$types';

// Keep SSR enabled so server data (restaurant, userRole, userEmail) flows to the client
export const load: LayoutLoad = async ({ data, parent }) => {
  const parentData = await parent();
  return { ...parentData, ...data };
};
