// ============================================================
// Cart Store — persisted to localStorage
// CartItem quantity ≥ 1; removed when qty reaches 0
// ============================================================

import { writable, derived } from 'svelte/store';
import type { CartItem, MenuItem } from '$lib/types';
import { deepClone } from '$lib/utils';

const STORAGE_KEY = 'gf_cart';

function loadFromStorage(): CartItem[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function saveToStorage(items: CartItem[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage quota exceeded — ignore
  }
}

function createCartStore() {
  const { subscribe, set, update } = writable<CartItem[]>(loadFromStorage());

  function persist(items: CartItem[]) {
    saveToStorage(items);
    set(items);
  }

  return {
    subscribe,

    addItem(menuItem: MenuItem, qty = 1, instructions = '') {
      update((items) => {
        const idx = items.findIndex((c) => c.menu_item.id === menuItem.id);
        let next: CartItem[];
        if (idx >= 0) {
          next = deepClone(items);
          next[idx].quantity += qty;
        } else {
          next = [...items, { menu_item: menuItem, quantity: qty, special_instructions: instructions }];
        }
        saveToStorage(next);
        return next;
      });
    },

    removeItem(menuItemId: string) {
      update((items) => {
        const next = items.filter((c) => c.menu_item.id !== menuItemId);
        saveToStorage(next);
        return next;
      });
    },

    setQuantity(menuItemId: string, qty: number) {
      update((items) => {
        let next: CartItem[];
        if (qty <= 0) {
          next = items.filter((c) => c.menu_item.id !== menuItemId);
        } else {
          next = deepClone(items);
          const idx = next.findIndex((c) => c.menu_item.id === menuItemId);
          if (idx >= 0) next[idx].quantity = qty;
        }
        saveToStorage(next);
        return next;
      });
    },

    updateInstructions(menuItemId: string, instructions: string) {
      update((items) => {
        const next = deepClone(items);
        const idx = next.findIndex((c) => c.menu_item.id === menuItemId);
        if (idx >= 0) next[idx].special_instructions = instructions;
        saveToStorage(next);
        return next;
      });
    },

    clear() {
      persist([]);
    }
  };
}

export const cart = createCartStore();

/** Total item count */
export const cartCount = derived(cart, ($cart) =>
  $cart.reduce((sum, c) => sum + c.quantity, 0)
);

/** Total price in rupees */
export const cartTotal = derived(cart, ($cart) =>
  $cart.reduce((sum, c) => sum + c.menu_item.price * c.quantity, 0)
);
