<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { formatCurrency, DIETARY_META } from '$lib/utils';
  import { toast } from 'svelte-sonner';
  import { Plus, Search, Edit2, Trash2, Image as ImageIcon, RefreshCw, X, UtensilsCrossed } from 'lucide-svelte';
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
        toast.success('Item updated');
      } else {
        const { data, error } = await supabase.from('menu_items').insert(payload).select().single();
        if (error) throw error;
        items = [data, ...items];
        toast.success('Item added');
      }
      showModal = false;
    } catch (e: any) {
      toast.error('Failed to save: ' + e.message);
    } finally {
      isSaving = false;
    }
  }
</script>

<svelte:head>
  <title>Menu | Management Console</title>
</svelte:head>

<div class="h-full flex flex-col gap-6 animate-fade-in font-sans text-text-primary">
  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
    <div>
      <h1 class="text-3xl font-display font-bold tracking-tight">Menu Manager</h1>
      <p class="text-text-secondary mt-1 font-medium">Curate and configure restaurant offerings.</p>
    </div>
    
    <div class="flex flex-wrap gap-3 w-full sm:w-auto items-center">
      {#if restaurants.length > 0}
        <select class="bg-black/20 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 outline-none focus:border-brand transition-colors text-sm font-medium" bind:value={selectedRestaurantId}>
          {#each restaurants as res}
            <option value={res.id}>{res.name}</option>
          {/each}
        </select>
      {/if}
      <div class="relative flex-1 sm:w-64">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
        <input 
          type="text" 
          bind:value={searchQuery} 
          placeholder="Search items..." 
          class="w-full bg-black/20 backdrop-blur-md border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm outline-none focus:border-brand transition-colors"
        />
      </div>
      <button 
        class="bg-brand text-black font-semibold rounded-full px-5 py-2 flex items-center gap-2 hover:bg-brand-hover hover:scale-105 shadow-glow transition-all text-sm disabled:opacity-50"
        onclick={openAddModal}
        disabled={!selectedRestaurantId}
      >
        <Plus size={16} /> Add Item
      </button>
      <button class="p-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50" onclick={loadData} disabled={isLoading || !selectedRestaurantId}>
        <RefreshCw size={16} class={isLoading ? 'animate-spin text-brand' : 'text-text-secondary'} />
      </button>
    </div>
  </div>

  <div class="flex-1 flex flex-col lg:flex-row gap-8 overflow-hidden">
    <!-- Category Sidebar (Floating Pills) -->
    <div class="w-full lg:w-56 flex-shrink-0 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto pb-4 hide-scrollbar">
      <button 
        class="text-left px-5 py-3 text-sm font-medium rounded-2xl transition-all whitespace-nowrap {selectedCategory === null ? 'bg-white text-black shadow-float' : 'bg-white/5 text-text-secondary hover:bg-white/10'}"
        onclick={() => selectedCategory = null}
      >
        All Items
      </button>
      
      {#each categories as category}
        <button 
          class="text-left px-5 py-3 text-sm font-medium rounded-2xl transition-all whitespace-nowrap flex items-center gap-3 {selectedCategory === category.id ? 'bg-white text-black shadow-float' : 'bg-white/5 text-text-secondary hover:bg-white/10'}"
          onclick={() => selectedCategory = category.id}
        >
          <span class="text-lg">{category.icon_emoji || '🍽️'}</span>
          {category.name}
        </button>
      {/each}
    </div>

    <!-- Items Grid (Liquid Glass Cards) -->
    <div class="flex-1 overflow-y-auto pb-12 pr-2 hide-scrollbar">
      {#if isLoading}
        <div class="h-64 flex items-center justify-center">
          <RefreshCw size={32} class="animate-spin text-brand opacity-50" />
        </div>
      {:else if errorMsg}
        <div class="glass-panel h-64 flex flex-col items-center justify-center text-red-400 rounded-3xl p-6 text-center">
          <p class="font-bold mb-2">Error Loading Data</p>
          <p class="text-sm opacity-80">{errorMsg}</p>
        </div>
      {:else if filteredItems.length === 0}
        <div class="glass-panel h-64 flex flex-col items-center justify-center text-text-secondary rounded-3xl">
          <UtensilsCrossed size={48} class="mb-4 opacity-20" />
          <p class="font-medium">No items found.</p>
        </div>
      {:else}
        <div class="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
          {#each filteredItems as item (item.id)}
            <div class="glass-strong border border-white/5 hover:border-white/10 rounded-3xl overflow-hidden flex flex-col group relative transition-all duration-300 hover:shadow-float {item.is_available ? '' : 'opacity-60 grayscale-[50%]'}">
              
              {#if !item.is_available}
                <div class="absolute top-3 right-3 z-10 bg-red-500/20 backdrop-blur-md text-red-400 border border-red-500/30 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Out of Stock
                </div>
              {/if}

              <div class="h-48 bg-white/5 relative overflow-hidden flex items-center justify-center">
                {#if item.image_url}
                  <img src={item.image_url} alt={item.name} class="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" />
                {:else}
                  <ImageIcon size={48} class="text-white/10" />
                {/if}
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                
                <!-- Quick actions on hover -->
                <div class="absolute top-3 left-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button 
                    class="p-2 bg-black/40 hover:bg-brand rounded-full text-white backdrop-blur-md transition-colors" 
                    title="Edit"
                    onclick={() => openEditModal(item)}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    class="p-2 bg-black/40 hover:bg-red-500 rounded-full text-white backdrop-blur-md transition-colors" 
                    title="Delete"
                    onclick={() => deleteItem(item.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div class="p-5 flex-1 flex flex-col relative z-10 -mt-6 bg-gradient-to-b from-transparent to-surface/80">
                <div class="flex justify-between items-start mb-2">
                  <h3 class="font-bold text-xl leading-tight truncate pr-4">{item.name}</h3>
                  <div class="text-right shrink-0">
                    <span class="font-bold text-brand text-lg">{formatCurrency(item.price)}</span>
                    {#if item.happy_hour_discount}
                      <div class="text-[10px] text-green-400 font-bold uppercase tracking-wide bg-green-500/10 px-2 py-0.5 rounded-full inline-block mt-1">-{item.happy_hour_discount}% HH</div>
                    {/if}
                  </div>
                </div>
                
                <p class="text-sm text-text-secondary line-clamp-2 mb-4 flex-1">{item.description}</p>
                
                <div class="flex flex-wrap gap-1.5 mb-5">
                  {#each item.dietary_tags || [] as tag}
                    {#if DIETARY_META[tag as DietaryTag]}
                      <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-full border border-current" style="color: {DIETARY_META[tag as DietaryTag].color}; background: {DIETARY_META[tag as DietaryTag].color}15">
                        {DIETARY_META[tag as DietaryTag].label}
                      </span>
                    {/if}
                  {/each}
                </div>
                
                <div class="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                  <span class="text-sm font-semibold {item.is_available ? 'text-green-400' : 'text-red-400'}">
                    {item.is_available ? 'Available' : 'Unavailable'}
                  </span>
                  
                  <label class="toggle relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      class="sr-only peer" 
                      checked={item.is_available} 
                      onchange={() => toggleAvailability(item)}
                    >
                    <div class="w-12 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand shadow-inner"></div>
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

<!-- Liquid Glass Edit Modal -->
{#if showModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in" onclick={(e) => { if(e.target === e.currentTarget) showModal = false; }}>
    <div class="glass-panel w-full max-w-2xl rounded-[2rem] p-8 shadow-float animate-slide-up relative overflow-hidden" onclick={(e) => e.stopPropagation()}>
      <div class="absolute top-0 right-0 w-64 h-64 bg-brand/10 rounded-full blur-[80px] -z-10 -translate-y-1/2 translate-x-1/2"></div>
      
      <div class="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
        <h2 class="text-2xl font-display font-bold">{editingItemId ? 'Edit Item' : 'New Menu Item'}</h2>
        <button class="p-2 bg-white/5 hover:bg-white/10 rounded-full text-text-secondary hover:text-white transition-colors" onclick={() => showModal = false}><X size={18} /></button>
      </div>
      
      <div class="space-y-5 max-h-[60vh] overflow-y-auto pr-2 hide-scrollbar">
        <div class="grid grid-cols-2 gap-5">
          <div class="col-span-2 space-y-1.5">
            <label class="text-sm font-medium text-text-secondary pl-1" for="name">Name</label>
            <input id="name" type="text" class="w-full bg-black/20 border border-white/10 rounded-2xl p-3 text-sm outline-none focus:border-brand transition-all backdrop-blur-sm" bind:value={itemForm.name} placeholder="Item name" />
          </div>
          <div class="space-y-1.5">
            <label class="text-sm font-medium text-text-secondary pl-1" for="price">Price (₹)</label>
            <input id="price" type="number" step="0.01" class="w-full bg-black/20 border border-white/10 rounded-2xl p-3 text-sm outline-none focus:border-brand transition-all backdrop-blur-sm" bind:value={itemForm.price} placeholder="0.00" />
          </div>
          <div class="space-y-1.5">
            <label class="text-sm font-medium text-text-secondary pl-1" for="hh_discount">Happy Hour Discount %</label>
            <input id="hh_discount" type="number" step="1" min="0" max="100" class="w-full bg-black/20 border border-white/10 rounded-2xl p-3 text-sm outline-none focus:border-brand transition-all backdrop-blur-sm" bind:value={itemForm.happy_hour_discount} placeholder="e.g. 20" />
          </div>
          <div class="col-span-2 space-y-1.5">
            <label class="text-sm font-medium text-text-secondary pl-1" for="cat">Category</label>
            <select id="cat" class="w-full bg-black/20 border border-white/10 rounded-2xl p-3 text-sm outline-none focus:border-brand transition-all backdrop-blur-sm appearance-none" bind:value={itemForm.category_id}>
              <option value="" disabled selected>Select category...</option>
              {#each categories as cat}
                <option value={cat.id}>{cat.name}</option>
              {/each}
            </select>
          </div>
          
          <div class="col-span-2 space-y-1.5">
            <label class="text-sm font-medium text-text-secondary pl-1" for="img">Image URL</label>
            <input id="img" type="text" class="w-full bg-black/20 border border-white/10 rounded-2xl p-3 text-sm outline-none focus:border-brand transition-all backdrop-blur-sm" bind:value={itemForm.image_url} placeholder="Image link" />
          </div>
          <div class="col-span-2 space-y-1.5">
            <span class="text-sm font-medium text-text-secondary pl-1">Dietary Tags</span>
            <div class="flex flex-wrap gap-2 mt-2">
              {#each Object.entries(DIETARY_META) as [tag, meta]}
                <button 
                  class="px-4 py-2 rounded-full text-xs font-bold border transition-all {itemForm.dietary_tags.includes(tag as DietaryTag) ? 'scale-105' : 'opacity-50 hover:opacity-100 grayscale'}"
                  style="background-color: {itemForm.dietary_tags.includes(tag as DietaryTag) ? meta.color + '20' : 'transparent'}; color: {meta.color}; border-color: {meta.color}"
                  onclick={() => toggleTag(tag as DietaryTag)}
                >
                  {meta.label}
                </button>
              {/each}
            </div>
          </div>
          <div class="col-span-2 space-y-1.5">
            <label class="text-sm font-medium text-text-secondary pl-1" for="desc">Description</label>
            <textarea id="desc" class="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-brand transition-all backdrop-blur-sm h-28 resize-none" bind:value={itemForm.description} placeholder="Delicious description..."></textarea>
          </div>
        </div>
      </div>
      
      <div class="flex justify-end gap-3 mt-8 pt-4 border-t border-white/5">
        <button class="px-6 py-2.5 rounded-full bg-white/5 hover:bg-white/10 font-medium transition-colors" onclick={() => showModal = false} disabled={isSaving}>Cancel</button>
        <button class="px-6 py-2.5 rounded-full bg-brand text-black font-semibold hover:bg-brand-hover hover:shadow-glow transition-all disabled:opacity-50 flex items-center gap-2" onclick={saveItem} disabled={isSaving}>
          {#if isSaving}
            <RefreshCw size={16} class="animate-spin" /> Saving...
          {:else}
            {editingItemId ? 'Update Item' : 'Create Item'}
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}
