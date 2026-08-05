// ============================================================
// Admin Store — live KDS orders, waiter requests, owner auth
// Auth: Supabase session when configured; localStorage mock otherwise
// ============================================================

import { writable, derived, get } from 'svelte/store';
import type { User } from '@supabase/supabase-js';
import type { Order, WaiterRequest, OrderStatus } from '$lib/types';
import { makeMockOrders, makeMockWaiterRequests } from '$lib/mock-data';
import { supabase } from '$lib/supabase';

// ─── Orders Store ─────────────────────────────────────────────
function createOrdersStore() {
  const { subscribe, set, update } = writable<Order[]>(makeMockOrders());

  return {
    subscribe,

    setOrders(orders: Order[]) {
      set(orders);
    },

    upsertOrder(order: Order) {
      update((orders) => {
        const idx = orders.findIndex((o) => o.id === order.id);
        if (idx >= 0) {
          const next = [...orders];
          next[idx] = order;
          return next;
        }
        return [order, ...orders];
      });
    },

    updateStatus(orderId: string, status: OrderStatus) {
      update((orders) =>
        orders.map((o) =>
          o.id === orderId ? { ...o, status, updated_at: new Date().toISOString() } : o
        )
      );
    },

    addOrder(order: Order) {
      update((orders) => [order, ...orders]);
    }
  };
}

export const adminOrders = createOrdersStore();

export const ordersByStatus = derived(adminOrders, ($orders) => ({
  pending: $orders.filter((o) => o.status === 'pending'),
  preparing: $orders.filter((o) => o.status === 'preparing'),
  ready: $orders.filter((o) => o.status === 'ready'),
  served: $orders.filter((o) => o.status === 'served'),
  paid: $orders.filter((o) => o.status === 'paid')
}));

// ─── Waiter Requests Store ────────────────────────────────────
function createWaiterStore() {
  const { subscribe, set, update } = writable<WaiterRequest[]>(makeMockWaiterRequests());

  return {
    subscribe,

    add(req: WaiterRequest) {
      update((reqs) => [req, ...reqs]);
    },

    acknowledge(id: string) {
      update((reqs) =>
        reqs.map((r) =>
          r.id === id ? { ...r, status: 'acknowledged', acknowledged_at: new Date().toISOString() } : r
        )
      );
    },

    resolve(id: string) {
      update((reqs) => reqs.filter((r) => r.id !== id));
    },

    setAll(reqs: WaiterRequest[]) {
      set(reqs);
    }
  };
}

export const waiterRequests = createWaiterStore();

export const pendingWaiterCount = derived(
  waiterRequests,
  ($reqs) => $reqs.filter((r) => r.status === 'pending').length
);

// ─── Owner Auth State ─────────────────────────────────────────

export type AdminUser = {
  id?: string;
  email: string;
  role: string;
  name?: string | null;
  avatarUrl?: string | null;
  provider?: string | null;
} | null;

const STORAGE_KEY = 'gf_admin_user';

function userFromSupabase(user: User): NonNullable<AdminUser> {
  const meta = user.user_metadata ?? {};
  return {
    id: user.id,
    email: user.email ?? meta.email ?? 'owner@restaurant.com',
    role: 'owner',
    name: meta.full_name ?? meta.name ?? null,
    avatarUrl: meta.avatar_url ?? meta.picture ?? null,
    provider: (user.app_metadata?.provider as string | undefined)
      ?? user.identities?.[0]?.provider
      ?? null
  };
}

function persist(user: AdminUser) {
  if (typeof localStorage === 'undefined') return;
  if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  else localStorage.removeItem(STORAGE_KEY);
}

function createAuthStore() {
  const stored =
    typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;

  let initial: AdminUser = null;
  try {
    initial = stored ? JSON.parse(stored) : null;
  } catch {
    initial = null;
  }

  const { subscribe, set } = writable<AdminUser>(initial);
  let listenerAttached = false;

  function applyUser(user: AdminUser) {
    persist(user);
    set(user);
  }

  return {
    subscribe,

    /** Mock / email demo login when Supabase is unavailable */
    login(email: string, extras?: Partial<NonNullable<AdminUser>>) {
      const user: NonNullable<AdminUser> = {
        email,
        role: 'owner',
        ...extras
      };
      applyUser(user);
    },

    setFromSupabaseUser(user: User | null) {
      applyUser(user ? userFromSupabase(user) : null);
    },

    /**
     * Hydrate from Supabase session (or keep mock). Call once on owner shell mount.
     * Returns the resolved user (or null).
     */
    async init(): Promise<AdminUser> {
      if (!supabase) return get({ subscribe });

      if (!listenerAttached) {
        listenerAttached = true;
        supabase.auth.onAuthStateChange((_event, session) => {
          applyUser(session?.user ? userFromSupabase(session.user) : null);
        });
      }

      const { data } = await supabase.auth.getSession();
      const user = data.session?.user ? userFromSupabase(data.session.user) : null;
      // Prefer live Supabase session over stale mock when configured
      if (user) applyUser(user);
      else if (data.session === null) {
        // Signed out remotely — clear mock only if we had a supabase-backed user
        const current = get({ subscribe });
        if (current?.id) applyUser(null);
      }
      return get({ subscribe });
    },

    async loginWithPassword(email: string, password: string) {
      if (!supabase) {
        this.login(email);
        return { error: null as string | null };
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      applyUser(data.user ? userFromSupabase(data.user) : null);
      return { error: null };
    },

    async loginWithGoogle(redirectTo: string) {
      if (!supabase) {
        return { error: 'Google sign-in requires Supabase. Set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY.' };
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });
      return { error: error?.message ?? null };
    },

    async logout() {
      if (supabase) {
        await supabase.auth.signOut();
      }
      applyUser(null);
    }
  };
}

export const adminUser = createAuthStore();

// ─── Admin Settings State ─────────────────────────────────────
type AdminSettings = {
  googleSheetUrl: string;
  spreadsheetId: string;
  googleAppsScriptUrl: string;
};

function createSettingsStore() {
  const defaultSettings: AdminSettings = {
    googleSheetUrl: '',
    spreadsheetId: '',
    googleAppsScriptUrl: ''
  };

  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('gf_admin_settings') : null;
  const initial: AdminSettings = stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;

  const { subscribe, update } = writable<AdminSettings>(initial);

  return {
    subscribe,
    updateSettings(settings: Partial<AdminSettings>) {
      update((current) => {
        const next = { ...current, ...settings };
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('gf_admin_settings', JSON.stringify(next));
        }
        return next;
      });
    }
  };
}

export const adminSettings = createSettingsStore();
