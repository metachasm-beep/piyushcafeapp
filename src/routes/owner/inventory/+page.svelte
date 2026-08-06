<script lang="ts">
  import { supabase } from '$lib/supabase';
  import type { MenuItem, MenuCategory } from '$lib/types';
  import { toast } from 'svelte-sonner';
  import { RefreshCw, Search } from 'lucide-svelte';
  import { adminUser } from '$lib/stores/admin';

  let items = $state<MenuItem[]>([]);
  let categories = $state<MenuCategory[]>([]);
  let isLoading = $state(true);
  let searchQuery = $state('');
  let selectedCategory = $state<string | null>(null);

  async function loadInventory() {
    isLoading = true;
    try {
      if (!supabase) throw new Error('Supabase not initialized');
      // In a real app, filter by $adminUser's restaurant_id
      const { data: catData } = await supabase.from('menu_categories').select('*').order('sort_order');
      const { data: itemData } = await supabase.from('menu_items').select('*').order('sort_order');
      
      if (catData) categories = catData;
      if (itemData) items = itemData;
    } catch (err: any) {
      toast.error('Failed to load inventory');
    } finally {
      isLoading = false;
    }
  }

  $effect(() => {
    loadInventory();
  });

  async function toggleAvailability(item: MenuItem) {
    const newValue = !item.is_available;
    // Optimistic UI update
    const idx = items.findIndex(i => i.id === item.id);
    if (idx !== -1) {
      items[idx] = { ...item, is_available: newValue };
    }
    if (!supabase) return;
    const { error } = await supabase
      .from('menu_items')
      .update({ is_available: newValue })
      .eq('id', item.id);
      
    if (error) {
      toast.error(`Failed to update ${item.name}`);
      // Revert
      if (idx !== -1) {
        items[idx] = { ...item, is_available: !newValue };
      }
    } else {
      toast.success(`${item.name} marked as ${newValue ? 'In Stock' : 'Out of Stock'}`);
    }
  }

  let filteredItems = $derived(
    items.filter(item => {
      const matchesCategory = selectedCategory ? item.category_id === selectedCategory : true;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
  );
</script>

<div class="max-w-6xl mx-auto space-y-6 animate-fade-in pb-10">
  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div>
      <h2 class="text-2xl font-bold font-display">Inventory Management</h2>
      <p class="text-[var(--color-text-secondary)]">Quickly mark items as out of stock.</p>
    </div>
    <div class="flex items-center gap-3 w-full md:w-auto">
      <div class="relative flex-1 md:w-64">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" size={18} />
        <input 
          type="text" 
          bind:value={searchQuery} 
          placeholder="Search items..." 
          class="input-dark w-full pl-10"
        />
      </div>
      <button class="p-3 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-card-hover)] transition-colors" onclick={loadInventory}>
        <RefreshCw size={20} class={isLoading ? 'animate-spin' : ''} />
      </button>
    </div>
  </div>

  <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
    <button 
      class="px-4 py-2 rounded-full whitespace-nowrap transition-colors {selectedCategory === null ? 'bg-[var(--color-brand)] text-black font-bold' : 'bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-card-hover)]'}"
      onclick={() => selectedCategory = null}
    >
      All Items
    </button>
    {#each categories as cat}
      <button 
        class="px-4 py-2 rounded-full whitespace-nowrap transition-colors {selectedCategory === cat.id ? 'bg-[var(--color-brand)] text-black font-bold' : 'bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-card-hover)]'}"
        onclick={() => selectedCategory = cat.id}
      >
        {cat.name}
      </button>
    {/each}
  </div>

  {#if isLoading && items.length === 0}
    <div class="flex items-center justify-center p-12">
      <div class="w-12 h-12 border-4 border-[var(--color-brand)] border-t-transparent rounded-full animate-spin"></div>
    </div>
  {:else if filteredItems.length === 0}
    <div class="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-12 text-center text-[var(--color-text-secondary)]">
      No items found matching your filters.
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {#each filteredItems as item}
        <div class="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-4 flex flex-col gap-3 transition-colors relative overflow-hidden group">
          <div class="flex items-start gap-3">
            <div class="w-16 h-16 rounded-xl bg-gray-800 flex-shrink-0 relative overflow-hidden">
              {#if item.image_url}
                <img src={item.image_url} alt={item.name} class="w-full h-full object-cover {item.is_available ? '' : 'opacity-40 grayscale'}" />
              {:else}
                <div class="w-full h-full flex items-center justify-center text-gray-500">No Img</div>
              {/if}
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="font-bold truncate text-[var(--color-text-primary)] {item.is_available ? '' : 'opacity-50'}">{item.name}</h4>
              <p class="text-sm font-bold text-[var(--color-brand)] mt-1 {item.is_available ? '' : 'opacity-50'}">₹{item.price.toFixed(2)}</p>
            </div>
          </div>
          
          <div class="mt-auto pt-3 border-t border-[var(--color-border)] flex items-center justify-between">
            <span class="text-sm font-medium {item.is_available ? 'text-green-400' : 'text-red-400'}">
              {item.is_available ? 'In Stock' : 'Out of Stock'}
            </span>
            <button 
              class="px-3 py-1.5 rounded-lg text-sm font-bold transition-colors {item.is_available ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'}"
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
