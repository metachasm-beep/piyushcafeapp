// ============================================================
// Session Store — anonymous customer session
// Persists a UUID to localStorage to identify the customer
// Stores which table the customer is at + active order
// ============================================================

import { writable, derived } from 'svelte/store';
import { getOrCreateSession } from '$lib/utils';
import type { Table, Restaurant } from '$lib/types';

type CustomerSession = {
  sessionId: string;
  restaurantId: string | null;
  tableId: string | null;
  restaurant: Restaurant | null;
  table: Table | null;
  /** The current active order for this session, if any */
  activeOrderId: string | null;
};

const ORDER_KEY = 'gf_active_order_id';

function loadActiveOrder(): string | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    return localStorage.getItem(ORDER_KEY);
  } catch {
    return null;
  }
}

function persistActiveOrder(orderId: string | null) {
  if (typeof localStorage === 'undefined') return;
  try {
    if (orderId) localStorage.setItem(ORDER_KEY, orderId);
    else localStorage.removeItem(ORDER_KEY);
  } catch {
    // ignore
  }
}

function createSessionStore() {
  const initial: CustomerSession = {
    sessionId: typeof localStorage !== 'undefined' ? getOrCreateSession() : 'ssr-placeholder',
    restaurantId: null,
    tableId: null,
    restaurant: null,
    table: null,
    activeOrderId: loadActiveOrder()
  };

  const { subscribe, update } = writable<CustomerSession>(initial);

  return {
    subscribe,

    init(restaurant: Restaurant, table: Table) {
      update((s) => ({
        ...s,
        restaurantId: restaurant.id,
        tableId: table.id,
        restaurant,
        table,
        activeOrderId: s.activeOrderId ?? loadActiveOrder()
      }));
    },

    setActiveOrder(orderId: string) {
      persistActiveOrder(orderId);
      update((s) => ({ ...s, activeOrderId: orderId }));
    },

    clearOrder() {
      persistActiveOrder(null);
      update((s) => ({ ...s, activeOrderId: null }));
    }
  };
}

export const session = createSessionStore();

export const currentTable = derived(session, ($s) => $s.table);
export const currentRestaurant = derived(session, ($s) => $s.restaurant);
