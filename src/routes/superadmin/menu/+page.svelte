<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { formatCurrency, DIETARY_META } from '$lib/utils';
  import { toast } from 'svelte-sonner';
  import { Plus, Search, Edit2, Trash2, Image as ImageIcon, UtensilsCrossed, RefreshCw, Save } from '@lucide/svelte';
  import type { MenuItem, MenuCategory, DietaryTag, Restaurant } from '$lib/types';

  let restaurants = $state<Restaurant[]>([]);
  let selectedRestaurantId = $state<string | null>(null);

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

  async function loadRestaurants() {
    if (!supabase) return;
    isLoading = true;
    const { data, error } = await supabase.from('restaurants').select('*').order('name');
    if (error) {
      toast.error('Failed to load restaurants: ' + error.message);
    } else {
      restaurants = data;
      if (restaurants.length > 0) {
        selectedRestaurantId = restaurants[0].id;
        await loadData();
      } else {
        isLoading = false;
      }
    }
  }

  async function loadData() {
    if (!supabase || !selectedRestaurantId) return;
    isLoading = true;
    errorMsg = '';
    try {
      const [catRes, itemRes] = await Promise.all([
        supabase.from('menu_categories').select('*').eq('restaurant_id', selectedRestaurantId).order('sort_order'),
        supabase.from('menu_items').select('*').eq('restaurant_id', selectedRestaurantId).order('name')
      ]);

      if (catRes.error) throw catRes.error;
      if (itemRes.error) throw itemRes.error;

      categories = catRes.data;
      items = itemRes.data;
    } catch (e: any) {
      errorMsg = e.message || 'Failed to load data';
      toast.error(errorMsg);
    } finally {
      isLoading = false;
    }
  }

  $effect(() => {
    if (selectedRestaurantId && restaurants.length > 0) {
      loadData();
    }
  });

  onMount(() => {
    if (!supabase) {
      errorMsg = 'Supabase client not initialized.';
      isLoading = false;
      return;
    }
    loadRestaurants();
  });

  async function toggleAvailability(item: MenuItem) {
    if (!supabase) return;
    const newStatus = !item.is_available;
    const { error } = await supabase.from('menu_items').update({ is_available: newStatus }).eq('id', item.id);
    if (error) {
      toast.error('Failed to update: ' + error.message);
    } else {
      const idx = items.findIndex(i => i.id === item.id);
      if (idx !== -1) items[idx].is_available = newStatus;
      toast.success(`${item.name} marked as ${newStatus ? 'available' : 'unavailable'}`);
    }
  }

  async function deleteItem(id: string) {
    if (!supabase) return;
    if (confirm('Are you sure you want to delete this item?')) {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (error) {
        toast.error('Failed to delete: ' + error.message);
      } else {
        items = items.filter(i => i.id !== id);
        toast.success('Item deleted successfully');
      }
    }
  }
  
  let showModal = $state(false);
  let editingItemId = $state<string | null>(null);

  type FormType = {
    name: string;
    price: string;
    category_id: string;
    description: string;
    image_url: string;
    dietary_tags: DietaryTag[];
    happy_hour_discount: string;
  };
  let itemForm = $state<FormType>({
    name: '', price: '', category_id: '', description: '', image_url: '', dietary_tags: [], happy_hour_discount: ''
  });

  function openAddModal() {
    editingItemId = null;
    itemForm = { name: '', price: '', category_id: '', description: '', image_url: '', dietary_tags: [], happy_hour_discount: '' };
    showModal = true;
  }

  function openEditModal(item: MenuItem) {
    editingItemId = item.id;
    itemForm = {
      name: item.name,
      price: item.price.toString(),
      category_id: item.category_id,
      description: item.description || '',
      image_url: item.image_url || '',
      dietary_tags: item.dietary_tags || [],
      happy_hour_discount: item.happy_hour_discount != null ? item.happy_hour_discount.toString() : ''
    };
    showModal = true;
  }

  function toggleTag(tag: DietaryTag) {
    if (itemForm.dietary_tags.includes(tag)) {
      itemForm.dietary_tags = itemForm.dietary_tags.filter(t => t !== tag);
    } else {
      itemForm.dietary_tags = [...itemForm.dietary_tags, tag];
    }
  }

  async function saveItem() {
    if (!supabase || !selectedRestaurantId) return;
    if (!itemForm.name || !itemForm.price || !itemForm.category_id) {
      toast.error('Name, Price, and Category are required');
      return;
    }

    isSaving = true;
    const payload = {
      restaurant_id: selectedRestaurantId,
      category_id: itemForm.category_id,
      name: itemForm.name,
      description: itemForm.description,
      price: parseFloat(itemForm.price),
      image_url: itemForm.image_url || null,
      dietary_tags: itemForm.dietary_tags,
      happy_hour_discount: itemForm.happy_hour_discount ? parseFloat(itemForm.happy_hour_discount) : null,
      is_available: true,
      is_featured: false,
      sort_order: 0,
      updated_at: new Date().toISOString()
    };

    try {
      if (editingItemId) {
        const { data, error } = await supabase.from('menu_items').update(payload).eq('id', editingItemId).select().single();
        if (error) throw error;
        const idx = items.findIndex(i => i.id === editingItemId);
        if (idx !== -1) items[idx] = data;
        toast.success('Item updated successfully');
      } else {
        const { data, error } = await supabase.from('menu_items').insert(payload).select().single();
        if (error) throw error;
        items = [data, ...items];
        toast.success('Item added successfully');
      }
      showModal = false;
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
      <p class="text-[var(--color-text-secondary)] mt-1">Manage categories and menu items via Supabase</p>
    </div>
    
    <div class="flex flex-wrap gap-3 w-full sm:w-auto items-center">
      {#if restaurants.length > 0}
        <select class="input-dark rounded-lg py-2" bind:value={selectedRestaurantId}>
          {#each restaurants as res}
            <option value={res.id}>{res.name}</option>
          {/each}
        </select>
      {/if}
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
        onclick={openAddModal}
        disabled={!selectedRestaurantId}
      >
        <Plus size={18} />
        <span class="hidden sm:inline">Add Item</span>
      </button>
      <button class="w-10 h-10 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-surface)] text-[var(--color-text-secondary)]" onclick={loadData} disabled={isLoading || !selectedRestaurantId}>
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
                    class="p-1.5 bg-black/60 hover:bg-[var(--color-brand)] rounded text-white backdrop-blur-sm transition-colors" 
                    title="Edit"
                    onclick={() => openEditModal(item)}
                  >
                    <Edit2 size={14} />
                  </button>
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
                  <div class="text-right">
                    <span class="font-bold text-[var(--color-brand)]">{formatCurrency(item.price)}</span>
                    {#if item.happy_hour_discount}
                      <div class="text-[10px] text-green-400 font-bold uppercase">{item.happy_hour_discount}% HH Off</div>
                    {/if}
                  </div>
                </div>
                
                <p class="text-xs text-[var(--color-text-secondary)] line-clamp-2 mb-3 flex-1">{item.description}</p>
                
                <div class="flex flex-wrap gap-1 mb-4">
                  {#each item.dietary_tags || [] as tag}
                    {#if DIETARY_META[tag as DietaryTag]}
                      <span class="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded" style="background-color: {DIETARY_META[tag as DietaryTag].color}20; color: {DIETARY_META[tag as DietaryTag].color}">
                        {DIETARY_META[tag as DietaryTag].label}
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

<!-- Modal Placeholder for Add/Edit Item -->
{#if showModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onclick={(e) => { if(e.target === e.currentTarget) showModal = false; }}>
    <div class="glass-strong bg-[var(--color-card)] w-full max-w-2xl rounded-2xl border border-[var(--color-border)] p-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto hide-scrollbar" onclick={(e) => e.stopPropagation()}>
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-display font-bold">{editingItemId ? 'Edit' : 'Add'} Menu Item</h2>
        <button class="p-2 text-[var(--color-text-secondary)] hover:text-white" onclick={() => showModal = false}>✕</button>
      </div>
      
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2 space-y-1">
            <label class="text-sm text-[var(--color-text-secondary)]" for="name">Name</label>
            <input id="name" type="text" class="input-dark w-full" bind:value={itemForm.name} placeholder="Item name" />
          </div>
          <div class="space-y-1">
            <label class="text-sm text-[var(--color-text-secondary)]" for="price">Price (₹)</label>
            <input id="price" type="number" step="0.01" class="input-dark w-full" bind:value={itemForm.price} placeholder="0.00" />
          </div>
          <div class="space-y-1">
            <label class="text-sm text-[var(--color-text-secondary)]" for="hh_discount">Happy Hour Discount %</label>
            <input id="hh_discount" type="number" step="1" min="0" max="100" class="input-dark w-full" bind:value={itemForm.happy_hour_discount} placeholder="e.g. 20" />
          </div>
          <div class="col-span-2 space-y-1">
            <label class="text-sm text-[var(--color-text-secondary)]" for="cat">Category</label>
            <select id="cat" class="input-dark w-full appearance-none" bind:value={itemForm.category_id}>
              <option value="" disabled selected>Select category...</option>
              {#each categories as cat}
                <option value={cat.id}>{cat.name}</option>
              {/each}
            </select>
          </div>
          
          <div class="col-span-2 space-y-1">
            <label class="text-sm text-[var(--color-text-secondary)]" for="img">Image URL</label>
            <input id="img" type="text" class="input-dark w-full" bind:value={itemForm.image_url} placeholder="Image link" />
          </div>
          <div class="col-span-2 space-y-1">
            <span class="text-sm text-[var(--color-text-secondary)]">Dietary Tags</span>
            <div class="flex flex-wrap gap-2 mt-2">
              {#each Object.entries(DIETARY_META) as [tag, meta]}
                <button 
                  class="px-3 py-1.5 rounded-full text-xs font-bold border transition-colors {itemForm.dietary_tags.includes(tag as DietaryTag) ? '' : 'opacity-50'}"
                  style="background-color: {itemForm.dietary_tags.includes(tag as DietaryTag) ? meta.color + '30' : 'transparent'}; color: {meta.color}; border-color: {meta.color}"
                  onclick={() => toggleTag(tag as DietaryTag)}
                >
                  {meta.label}
                </button>
              {/each}
            </div>
          </div>
          <div class="col-span-2 space-y-1">
            <label class="text-sm text-[var(--color-text-secondary)]" for="desc">Description</label>
            <textarea id="desc" class="input-dark w-full h-24 resize-none" bind:value={itemForm.description} placeholder="Delicious description..."></textarea>
          </div>
        </div>
      </div>
      
      <div class="flex justify-end gap-3 mt-8">
        <button class="btn-ghost" onclick={() => showModal = false} disabled={isSaving}>Cancel</button>
        <button class="btn-brand flex items-center gap-2" onclick={saveItem} disabled={isSaving}>
          {#if isSaving}
            <RefreshCw size={16} class="animate-spin" /> Saving...
          {:else}
            <Save size={16} /> {editingItemId ? 'Update' : 'Save'}
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}
