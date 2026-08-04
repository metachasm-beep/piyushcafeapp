// ============================================================
// Admin Store — live KDS orders and waiter requests
// In mock mode: uses in-memory reactive state
// In production: Supabase real-time subscription channel
// ============================================================

import { writable, derived } from 'svelte/store';
import type { Order, WaiterRequest, OrderStatus } from '$lib/types';
import { makeMockOrders, makeMockWaiterRequests } from '$lib/mock-data';

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

// Derived: orders grouped by status
export const ordersByStatus = derived(adminOrders, ($orders) => ({
  pending:   $orders.filter((o) => o.status === 'pending'),
  preparing: $orders.filter((o) => o.status === 'preparing'),
  ready:     $orders.filter((o) => o.status === 'ready'),
  served:    $orders.filter((o) => o.status === 'served'),
  paid:      $orders.filter((o) => o.status === 'paid')
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

/** Count of pending (unacknowledged) waiter requests */
export const pendingWaiterCount = derived(
  waiterRequests,
  ($reqs) => $reqs.filter((r) => r.status === 'pending').length
);

// ─── Admin Auth State ─────────────────────────────────────────
// Simple client-side auth flag for mock mode.
// In production this is backed by Supabase session.

type AdminUser = { email: string; role: string } | null;

function createAuthStore() {
  const stored =
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('gf_admin_user')
      : null;

  const initial: AdminUser = stored ? JSON.parse(stored) : null;
  const { subscribe, set } = writable<AdminUser>(initial);

  return {
    subscribe,

    login(email: string) {
      const user: AdminUser = { email, role: 'owner' };
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('gf_admin_user', JSON.stringify(user));
      }
      set(user);
    },

    logout() {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('gf_admin_user');
      }
      set(null);
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
  
  const { subscribe, set, update } = writable<AdminSettings>(initial);

  return {
    subscribe,
    updateSettings(settings: Partial<AdminSettings>) {
      update(current => {
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
