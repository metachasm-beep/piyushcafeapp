// ============================================================
// Cart Store — persisted to localStorage
// CartItem quantity ≥ 1; removed when qty reaches 0
// ============================================================

import { writable, derived } from 'svelte/store';
import type { CartItem, MenuItem, MenuItemVariation, MenuItemAddon } from '$lib/types';
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

    // Generate a unique key for the cart item based on variations/addons
    generateCartKey(menuItemId: string, variation?: MenuItemVariation | null, addons: MenuItemAddon[] = []) {
      const vKey = variation ? variation.id : 'novar';
      const aKey = addons.map(a => a.id).sort().join('_') || 'noadd';
      return `${menuItemId}_${vKey}_${aKey}`;
    },

    addItem(menuItem: MenuItem, qty = 1, instructions = '', variation: MenuItemVariation | null = null, addons: MenuItemAddon[] = []) {
      update((items) => {
        const itemKey = cart.generateCartKey(menuItem.id, variation, addons);
        const idx = items.findIndex((c) => cart.generateCartKey(c.menu_item.id, c.variation, c.addons) === itemKey);
        let next: CartItem[];
        if (idx >= 0) {
          next = deepClone(items);
          next[idx].quantity += qty;
        } else {
          next = [...items, { menu_item: menuItem, quantity: qty, special_instructions: instructions, variation, addons }];
        }
        saveToStorage(next);
        return next;
      });
    },

    removeItem(itemKey: string) {
      update((items) => {
        const next = items.filter((c) => cart.generateCartKey(c.menu_item.id, c.variation, c.addons) !== itemKey);
        saveToStorage(next);
        return next;
      });
    },

    setQuantity(itemKey: string, qty: number) {
      update((items) => {
        let next: CartItem[];
        if (qty <= 0) {
          next = items.filter((c) => cart.generateCartKey(c.menu_item.id, c.variation, c.addons) !== itemKey);
        } else {
          next = deepClone(items);
          const idx = next.findIndex((c) => cart.generateCartKey(c.menu_item.id, c.variation, c.addons) === itemKey);
          if (idx >= 0) next[idx].quantity = qty;
        }
        saveToStorage(next);
        return next;
      });
    },

    updateInstructions(itemKey: string, instructions: string) {
      update((items) => {
        const next = deepClone(items);
        const idx = next.findIndex((c) => cart.generateCartKey(c.menu_item.id, c.variation, c.addons) === itemKey);
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
  $cart.reduce((sum, c) => {
    const varPrice = c.variation?.extra_price || 0;
    const addonsPrice = c.addons.reduce((a, b) => a + b.extra_price, 0);
    const itemTotal = c.menu_item.price + varPrice + addonsPrice;
    return sum + (itemTotal * c.quantity);
  }, 0)
);
