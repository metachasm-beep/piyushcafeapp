<script lang="ts">
  import { supabase } from '$lib/supabase';
  import type { MenuItem, MenuCategory } from '$lib/types';
  import { MOCK_MENU_ITEMS, MOCK_CATEGORIES } from '$lib/mock-data';
  import { toast } from 'svelte-sonner';
  import { RefreshCw, Search } from '@lucide/svelte';
  import { formatCurrency } from '$lib/utils';

  let items = $state<MenuItem[]>([]);
  let categories = $state<MenuCategory[]>([]);
  let isLoading = $state(true);
  let searchQuery = $state('');
  let selectedCategory = $state<string | null>(null);

  async function loadInventory() {
    isLoading = true;
    try {
      if (!supabase) {
        categories = MOCK_CATEGORIES;
        items = MOCK_MENU_ITEMS;
        return;
      }
      const { data: catData } = await supabase.from('menu_categories').select('*').order('sort_order');
      const { data: itemData } = await supabase.from('menu_items').select('*').order('sort_order');

      categories = catData ?? MOCK_CATEGORIES;
      items = itemData ?? MOCK_MENU_ITEMS;
    } catch {
      categories = MOCK_CATEGORIES;
      items = MOCK_MENU_ITEMS;
      toast.error('Using demo inventory data');
    } finally {
      isLoading = false;
    }
  }

  $effect(() => {
    loadInventory();
  });

  async function toggleAvailability(item: MenuItem) {
    const newValue = !item.is_available;
    const idx = items.findIndex((i) => i.id === item.id);
    if (idx !== -1) {
      items[idx] = { ...item, is_available: newValue };
    }

    if (!supabase) {
      toast.success(`${item.name} marked as ${newValue ? 'In Stock' : 'Out of Stock'}`);
      return;
    }

    const { error } = await supabase.from('menu_items').update({ is_available: newValue }).eq('id', item.id);

    if (error) {
      toast.error(`Failed to update ${item.name}`);
      if (idx !== -1) {
        items[idx] = { ...item, is_available: !newValue };
      }
    } else {
      toast.success(`${item.name} marked as ${newValue ? 'In Stock' : 'Out of Stock'}`);
    }
  }

  let filteredItems = $derived(
    items.filter((item) => {
      const matchesCategory = selectedCategory ? item.category_id === selectedCategory : true;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
  );
</script>

<svelte:head>
  <title>Inventory · Owner Portal</title>
</svelte:head>

<div>
  <div class="sg-page-header">
    <div>
      <h1 class="sg-page-title">Inventory</h1>
      <p class="sg-page-subtitle">Mark items in or out of stock</p>
    </div>
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
      <div style="position:relative;width:220px;max-width:100%;">
        <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#8b84c0;pointer-events:none;display:flex;">
          <Search size={16} />
        </span>
        <input type="text" bind:value={searchQuery} placeholder="Search items…" class="sg-input" style="padding-left:36px;" />
      </div>
      <button type="button" class="sg-btn-ghost" style="padding:10px;" onclick={loadInventory} aria-label="Refresh">
        <span class={isLoading ? 'spin' : ''} style="display:flex;">
          <RefreshCw size={18} />
        </span>
      </button>
    </div>
  </div>

  <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:16px;margin-bottom:8px;" class="sg-hide-scrollbar">
    <button
      type="button"
      class="sg-cat-pill {selectedCategory === null ? 'sg-cat-pill-active' : ''}"
      onclick={() => (selectedCategory = null)}
    >
      All Items
    </button>
    {#each categories as cat}
      <button
        type="button"
        class="sg-cat-pill {selectedCategory === cat.id ? 'sg-cat-pill-active' : ''}"
        onclick={() => (selectedCategory = cat.id)}
      >
        {cat.icon_emoji ?? ''} {cat.name}
      </button>
    {/each}
  </div>

  {#if isLoading && items.length === 0}
    <div style="display:flex;align-items:center;justify-content:center;padding:64px;">
      <div
        style="width:40px;height:40px;border:3px solid rgba(99,102,241,0.2);border-top-color:#6366f1;border-radius:50%;animation:spin 0.8s linear infinite;"
      ></div>
    </div>
  {:else if filteredItems.length === 0}
    <div class="sg-tile sg-tile-static" style="padding:48px;text-align:center;color:#8b84c0;">
      No items found matching your filters.
    </div>
  {:else}
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px;">
      {#each filteredItems as item}
        <div class="sg-tile" style="padding:16px;display:flex;flex-direction:column;gap:12px;">
          <div style="display:flex;align-items:flex-start;gap:12px;">
            <div
              style="width:64px;height:64px;border-radius:14px;background:rgba(99,102,241,0.08);flex-shrink:0;overflow:hidden;position:relative;"
            >
              {#if item.image_url}
                <img
                  src={item.image_url}
                  alt={item.name}
                  style="width:100%;height:100%;object-fit:cover;{item.is_available ? '' : 'opacity:0.4;filter:grayscale(1);'}"
                />
              {:else}
                <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#a5b4fc;font-size:11px;">
                  No Img
                </div>
              {/if}
            </div>
            <div style="flex:1;min-width:0;">
              <h4
                style="font-size:14px;font-weight:800;color:#1e1b4b;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;{item.is_available
                  ? ''
                  : 'opacity:0.5;'}"
              >
                {item.name}
              </h4>
              <p style="font-size:14px;font-weight:700;color:#6366f1;margin:6px 0 0;{item.is_available ? '' : 'opacity:0.5;'}">
                {formatCurrency(item.price)}
              </p>
            </div>
          </div>

          <div
            style="margin-top:auto;padding-top:12px;border-top:1px solid rgba(99,102,241,0.1);display:flex;align-items:center;justify-content:space-between;"
          >
            <span class={item.is_available ? 'sg-badge-active' : 'sg-badge-inactive'}>
              {item.is_available ? 'In Stock' : 'Out of Stock'}
            </span>
            <button
              type="button"
              style="padding:6px 12px;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;font-family:'Cabinet Grotesk',system-ui,sans-serif;border:1px solid {item.is_available
                ? 'rgba(239,68,68,0.25)'
                : 'rgba(34,197,94,0.25)'};background:{item.is_available
                ? 'rgba(239,68,68,0.08)'
                : 'rgba(34,197,94,0.08)'};color:{item.is_available ? '#dc2626' : '#16a34a'};"
              onclick={() => toggleAvailability(item)}
            >
              {item.is_available ? 'Mark OOS' : 'Restock'}
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  :global(.spin) {
    animation: spin 0.8s linear infinite;
  }
</style>
