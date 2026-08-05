// ============================================================
// Session Store — anonymous customer session
// Persists a UUID to localStorage to identify the customer
// Stores which table the customer is at
// ============================================================

import { writable, derived } from 'svelte/store';
import { getOrCreateSession } from '$lib/utils';
import type { Table, Restaurant, Order } from '$lib/types';

type CustomerSession = {
  sessionId: string;
  restaurantId: string | null;
  tableId: string | null;
  restaurant: Restaurant | null;
  table: Table | null;
  /** The current active order for this session, if any */
  activeOrderId: string | null;
};

function createSessionStore() {
  const initial: CustomerSession = {
    sessionId: typeof localStorage !== 'undefined' ? getOrCreateSession() : 'ssr-placeholder',
    restaurantId: null,
    tableId: null,
    restaurant: null,
    table: null,
    activeOrderId: null
  };

  const { subscribe, update, set } = writable<CustomerSession>(initial);

  return {
    subscribe,

    init(restaurant: Restaurant, table: Table) {
      update((s) => ({
        ...s,
        restaurantId: restaurant.id,
        tableId: table.id,
        restaurant,
        table
      }));
    },

    setActiveOrder(orderId: string) {
      update((s) => ({ ...s, activeOrderId: orderId }));
    },

    clearOrder() {
      update((s) => ({ ...s, activeOrderId: null }));
    }
  };
}

export const session = createSessionStore();

export const currentTable = derived(session, ($s) => $s.table);
export const currentRestaurant = derived(session, ($s) => $s.restaurant);
