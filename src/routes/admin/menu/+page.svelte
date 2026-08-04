<script lang="ts">
  import { onMount } from 'svelte';
  import { getCategories, getMenuItems, addMenuItemToSheet, deleteMenuItemFromSheet, toggleMenuItemAvailabilityInSheet } from '$lib/sheets';
  import { formatCurrency, DIETARY_META, generateUUID } from '$lib/utils';
  import { toast } from 'svelte-sonner';
  import { Plus, Search, Edit2, Trash2, Image as ImageIcon, UtensilsCrossed, RefreshCw } from '@lucide/svelte';
  import type { MenuItem, MenuCategory } from '$lib/types';
  import { adminSettings } from '$lib/stores/admin';

  let items = $state<MenuItem[]>([]);
  let categories = $state<MenuCategory[]>([]);
  let isLoading = $state(true);
  let isSaving = $state(false);
  let errorMsg = $state('');

  let selectedCategory = $state<string | null>(null);
  let searchQuery = $state('');

  let filteredItems = $derived(
    items.filter(item => {
      const matchesCategory = selectedCategory ? item.category_id === selectedCategory : true;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    })
  );

  async function loadData() {
    if (!$adminSettings.spreadsheetId) {
      errorMsg = 'Google Sheets not configured. Please go to Settings.';
      isLoading = false;
      return;
    }
    isLoading = true;
    errorMsg = '';
    try {
      [categories, items] = await Promise.all([
        getCategories(),
        getMenuItems()
      ]);
    } catch (e: any) {
      errorMsg = e.message || 'Failed to load data';
      toast.error(errorMsg);
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    loadData();
  });

  async function toggleAvailability(item: MenuItem) {
    if (!$adminSettings.googleAppsScriptUrl) {
      toast.error('Webhook not configured in Settings.');
      return;
    }
    const idx = items.findIndex(i => i.id === item.id);
    if (idx !== -1) {
      const newStatus = !items[idx].is_available;
      // Optimistic update
      items[idx].is_available = newStatus;
      try {
        await toggleMenuItemAvailabilityInSheet(item.id, newStatus);
        toast.success(`${item.name} marked as ${newStatus ? 'available' : 'unavailable'}`);
      } catch (e: any) {
        // Revert on fail
        items[idx].is_available = !newStatus;
        toast.error('Failed to update: ' + e.message);
      }
    }
  }

  async function deleteItem(id: string) {
    if (!$adminSettings.googleAppsScriptUrl) {
      toast.error('Webhook not configured in Settings.');
      return;
    }
    if (confirm('Are you sure you want to delete this item?')) {
      const prevItems = [...items];
      // Optimistic update
      items = items.filter(i => i.id !== id);
      try {
        await deleteMenuItemFromSheet(id);
        toast.success('Item deleted successfully');
      } catch (e: any) {
        items = prevItems;
        toast.error('Failed to delete: ' + e.message);
      }
    }
  }
  
  let showModal = $state(false);
  let newItemForm = $state({
    name: '',
    price: '',
    category_id: '',
    description: '',
    image_url: ''
  });

  async function saveItem() {
    if (!$adminSettings.googleAppsScriptUrl) {
      toast.error('Webhook not configured in Settings.');
      return;
    }
    if (!newItemForm.name || !newItemForm.price || !newItemForm.category_id) {
      toast.error('Name, Price, and Category are required');
      return;
    }

    isSaving = true;
    const newItem: MenuItem = {
      id: `item_${generateUUID()}`,
      restaurant_id: 'res_1',
      category_id: newItemForm.category_id,
      name: newItemForm.name,
      description: newItemForm.description,
      price: parseFloat(newItemForm.price),
      image_url: newItemForm.image_url,
      preparation_time: null,
      dietary_tags: [],
      is_available: true,
      is_featured: false,
      sort_order: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      await addMenuItemToSheet(newItem);
      items = [newItem, ...items];
      toast.success('Item added successfully');
      showModal = false;
      newItemForm = { name: '', price: '', category_id: '', description: '', image_url: '' };
    } catch (e: any) {
      toast.error('Failed to save item: ' + e.message);
    } finally {
      isSaving = false;
    }
  }
</script>

<div class="h-full flex flex-col gap-6">
  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <div>
      <h1 class="text-3xl font-display font-bold text-[var(--color-text-primary)]">Menu Manager</h1>
      <p class="text-[var(--color-text-secondary)] mt-1">Manage categories and menu items directly via Google Sheets</p>
    </div>
    
    <div class="flex gap-3 w-full sm:w-auto">
      <div class="relative flex-1 sm:w-64">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" size={18} />
        <input 
          type="text" 
          bind:value={searchQuery} 
          placeholder="Search items..." 
          class="input-dark w-full pl-10 py-2 rounded-lg"
        />
      </div>
      <button 
        class="btn-brand flex items-center gap-2 whitespace-nowrap"
        onclick={() => showModal = true}
      >
        <Plus size={18} />
        <span class="hidden sm:inline">Add Item</span>
      </button>
      <button class="w-10 h-10 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-surface)] text-[var(--color-text-secondary)]" onclick={loadData} disabled={isLoading}>
        <RefreshCw size={18} class={isLoading ? 'animate-spin' : ''} />
      </button>
    </div>
  </div>

  <div class="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
    <!-- Category Sidebar -->
    <div class="w-full lg:w-64 flex-shrink-0 flex flex-col gap-2 overflow-x-auto lg:overflow-y-auto pb-4 hide-scrollbar">
      <button 
        class="w-full text-left px-4 py-3 rounded-xl transition-all font-medium {selectedCategory === null ? 'bg-[var(--color-brand)] text-white shadow-lg' : 'bg-[var(--color-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]'}"
        onclick={() => selectedCategory = null}
      >
        All Items
      </button>
      
      {#each categories as category}
        <button 
          class="w-full text-left px-4 py-3 rounded-xl transition-all font-medium flex items-center gap-3 {selectedCategory === category.id ? 'bg-[var(--color-brand)] text-white shadow-lg' : 'bg-[var(--color-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]'}"
          onclick={() => selectedCategory = category.id}
        >
          <span class="text-xl">{category.icon_emoji || '🍽️'}</span>
          {category.name}
        </button>
      {/each}
    </div>

    <!-- Items Grid -->
    <div class="flex-1 overflow-y-auto pb-12 pr-2">
      {#if isLoading}
        <div class="h-64 flex items-center justify-center">
          <RefreshCw size={32} class="animate-spin text-brand opacity-50" />
        </div>
      {:else if errorMsg}
        <div class="glass h-64 flex flex-col items-center justify-center text-red-400 rounded-xl p-6 text-center">
          <p class="font-bold mb-2">Error</p>
          <p class="text-sm opacity-80">{errorMsg}</p>
        </div>
      {:else if filteredItems.length === 0}
        <div class="glass h-64 flex flex-col items-center justify-center text-[var(--color-text-secondary)] rounded-xl">
          <UtensilsCrossed size={48} class="mb-4 opacity-20" />
          <p>No items found.</p>
        </div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {#each filteredItems as item (item.id)}
            <div class="glass border border-[var(--color-border)] rounded-xl overflow-hidden flex flex-col group relative {item.is_available ? '' : 'opacity-75 grayscale-[30%]'}">
              
              {#if !item.is_available}
                <div class="absolute top-2 right-2 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow-lg">
                  OUT OF STOCK
                </div>
              {/if}

              <div class="h-40 bg-[var(--color-surface)] relative overflow-hidden flex items-center justify-center">
                {#if item.image_url}
                  <img src={item.image_url} alt={item.name} class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                {:else}
                  <ImageIcon size={48} class="text-[var(--color-border)]" />
                {/if}
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                
                <!-- Quick actions on hover -->
                <div class="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button 
                    class="p-1.5 bg-black/60 hover:bg-red-500 rounded text-white backdrop-blur-sm transition-colors" 
                    title="Delete"
                    onclick={() => deleteItem(item.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              
              <div class="p-4 flex-1 flex flex-col">
                <div class="flex justify-between items-start mb-1">
                  <h3 class="font-bold text-lg leading-tight">{item.name}</h3>
                  <span class="font-bold text-[var(--color-brand)]">{formatCurrency(item.price)}</span>
                </div>
                
                <p class="text-xs text-[var(--color-text-secondary)] line-clamp-2 mb-3 flex-1">{item.description}</p>
                
                <div class="flex flex-wrap gap-1 mb-4">
                  {#each item.dietary_tags || [] as tag}
                    {#if DIETARY_META[tag]}
                      <span class="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded" style="background-color: {DIETARY_META[tag].color}20; color: {DIETARY_META[tag].color}">
                        {DIETARY_META[tag].label}
                      </span>
                    {/if}
                  {/each}
                </div>
                
                <div class="flex items-center justify-between pt-3 border-t border-[var(--color-border)] mt-auto">
                  <span class="text-sm font-medium {item.is_available ? 'text-green-400' : 'text-red-400'}">
                    {item.is_available ? 'Available' : 'Unavailable'}
                  </span>
                  
                  <label class="toggle relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      class="sr-only peer" 
                      checked={item.is_available} 
                      onchange={() => toggleAvailability(item)}
                    >
                    <div class="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-brand)]"></div>
                  </label>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- Modal Placeholder for Add Item -->
{#if showModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onclick={(e) => { if(e.target === e.currentTarget) showModal = false; }}>
    <div class="glass-strong bg-[var(--color-card)] w-full max-w-lg rounded-2xl border border-[var(--color-border)] p-6 shadow-2xl animate-slide-up" onclick={(e) => e.stopPropagation()}>
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-display font-bold">Add Menu Item</h2>
        <button class="p-2 text-[var(--color-text-secondary)] hover:text-white" onclick={() => showModal = false}>✕</button>
      </div>
      
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2 space-y-1">
            <label class="text-sm text-[var(--color-text-secondary)]" for="name">Name</label>
            <input id="name" type="text" class="input-dark w-full" bind:value={newItemForm.name} placeholder="Item name" />
          </div>
          <div class="space-y-1">
            <label class="text-sm text-[var(--color-text-secondary)]" for="price">Price (₹)</label>
            <input id="price" type="number" class="input-dark w-full" bind:value={newItemForm.price} placeholder="0.00" />
          </div>
          <div class="space-y-1">
            <label class="text-sm text-[var(--color-text-secondary)]" for="cat">Category</label>
            <select id="cat" class="input-dark w-full appearance-none" bind:value={newItemForm.category_id}>
              <option value="" disabled selected>Select category...</option>
              {#each categories as cat}
                <option value={cat.id}>{cat.name}</option>
              {/each}
            </select>
          </div>
          <div class="col-span-2 space-y-1">
            <label class="text-sm text-[var(--color-text-secondary)]" for="img">Image URL</label>
            <input id="img" type="text" class="input-dark w-full" bind:value={newItemForm.image_url} placeholder="Google Drive or Imgur link" />
          </div>
          <div class="col-span-2 space-y-1">
            <label class="text-sm text-[var(--color-text-secondary)]" for="desc">Description</label>
            <textarea id="desc" class="input-dark w-full h-24 resize-none" bind:value={newItemForm.description} placeholder="Delicious description..."></textarea>
          </div>
        </div>
      </div>
      
      <div class="flex justify-end gap-3 mt-8">
        <button class="btn-ghost" onclick={() => showModal = false} disabled={isSaving}>Cancel</button>
        <button class="btn-brand flex items-center gap-2" onclick={saveItem} disabled={isSaving}>
          {#if isSaving}
            <RefreshCw size={16} class="animate-spin" /> Saving...
          {:else}
            Save Item
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}
