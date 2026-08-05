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
  <title>Menu | Terminal</title>
</svelte:head>

<div class="h-full flex flex-col gap-6 animate-fade-in font-sans text-slate-900 pb-12">
  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-slate-200 pb-4">
    <div>
      <h1 class="text-2xl font-bold tracking-tight uppercase">Menu Definitions</h1>
      <p class="text-xs text-slate-500 mt-1 font-mono uppercase tracking-widest">Global item catalog configuration</p>
    </div>
    
    <div class="flex flex-wrap gap-2 w-full sm:w-auto items-center">
      {#if restaurants.length > 0}
        <select class="bg-white border border-slate-200 rounded-none px-3 py-1.5 outline-none focus:border-blue-500 transition-colors text-xs font-mono uppercase tracking-widest" bind:value={selectedRestaurantId}>
          {#each restaurants as res}
            <option value={res.id}>{res.name}</option>
          {/each}
        </select>
      {/if}
      <div class="relative flex-1 sm:w-64">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
        <input 
          type="text" 
          bind:value={searchQuery} 
          placeholder="SEARCH ITEMS..." 
          class="w-full bg-slate-50 border border-slate-200 rounded-none pl-9 pr-3 py-1.5 text-xs font-mono uppercase outline-none focus:border-blue-500 focus:bg-white transition-colors placeholder:text-slate-400"
        />
      </div>
      <button class="p-1.5 border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors disabled:opacity-50" onclick={loadData} disabled={isLoading || !selectedRestaurantId}>
        <RefreshCw size={16} class={isLoading ? 'animate-spin' : ''} />
      </button>
      <button 
        class="bg-blue-600 text-white font-mono uppercase tracking-widest text-xs px-4 py-1.5 flex items-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
        onclick={openAddModal}
        disabled={!selectedRestaurantId}
      >
        <Plus size={14} /> Append Record
      </button>
    </div>
  </div>

  <div class="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
    <!-- Category Sidebar (Dense List) -->
    <div class="w-full lg:w-56 flex-shrink-0 border border-slate-200 bg-white flex lg:flex-col overflow-x-auto lg:overflow-y-auto hide-scrollbar">
      <div class="bg-slate-50 border-b border-slate-200 p-2 text-[10px] font-mono uppercase tracking-widest text-slate-500">Categories</div>
      <button 
        class="text-left px-4 py-3 text-xs font-mono uppercase tracking-wide transition-colors whitespace-nowrap border-b border-slate-100 {selectedCategory === null ? 'bg-blue-50 text-blue-700 font-bold border-l-2 border-l-blue-600' : 'text-slate-600 hover:bg-slate-50 border-l-2 border-l-transparent'}"
        onclick={() => selectedCategory = null}
      >
        * ALL RECORDS
      </button>
      
      {#each categories as category}
        <button 
          class="text-left px-4 py-3 text-xs font-mono uppercase tracking-wide transition-colors whitespace-nowrap flex items-center gap-2 border-b border-slate-100 {selectedCategory === category.id ? 'bg-blue-50 text-blue-700 font-bold border-l-2 border-l-blue-600' : 'text-slate-600 hover:bg-slate-50 border-l-2 border-l-transparent'}"
          onclick={() => selectedCategory = category.id}
        >
          <span class="opacity-50">{category.icon_emoji || '-'}</span>
          {category.name}
        </button>
      {/each}
    </div>

    <!-- Items Grid (Spreadsheet Style) -->
    <div class="flex-1 overflow-y-auto hide-scrollbar border border-slate-200 bg-white">
      {#if isLoading}
        <div class="h-64 flex items-center justify-center">
          <RefreshCw size={24} class="animate-spin text-slate-400" />
        </div>
      {:else if errorMsg}
        <div class="h-64 flex flex-col items-center justify-center text-red-600 p-6 text-center bg-red-50 font-mono text-sm">
          <p class="font-bold mb-2">ERR_LOAD</p>
          <p class="opacity-80">{errorMsg}</p>
        </div>
      {:else if filteredItems.length === 0}
        <div class="h-64 flex flex-col items-center justify-center text-slate-400">
          <UtensilsCrossed size={32} class="mb-2 opacity-50" />
          <p class="text-xs font-mono uppercase tracking-widest">0 RECORDS</p>
        </div>
      {:else}
        <table class="w-full text-left border-collapse">
          <thead class="sticky top-0 bg-slate-50 z-10">
            <tr class="border-b border-slate-200 text-[10px] font-mono uppercase tracking-widest text-slate-500">
              <th class="p-3 w-12 text-center border-r border-slate-200">IMG</th>
              <th class="p-3 border-r border-slate-200">Identifier</th>
              <th class="p-3 border-r border-slate-200 hidden md:table-cell">Metadata</th>
              <th class="p-3 border-r border-slate-200 text-right">Value (INR)</th>
              <th class="p-3 border-r border-slate-200 text-center">Status</th>
              <th class="p-3 text-center">CMD</th>
            </tr>
          </thead>
          <tbody class="text-sm divide-y divide-slate-100">
            {#each filteredItems as item (item.id)}
              <tr class="hover:bg-slate-50 transition-colors group {item.is_available ? '' : 'opacity-60 bg-slate-50/50'}">
                <td class="p-2 border-r border-slate-200">
                  <div class="w-10 h-10 bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto overflow-hidden rounded-none">
                    {#if item.image_url}
                      <img src={item.image_url} alt="img" class="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                    {:else}
                      <ImageIcon size={16} class="text-slate-300" />
                    {/if}
                  </div>
                </td>
                <td class="p-3 border-r border-slate-200">
                  <div class="font-bold text-slate-900 uppercase tracking-tight">{item.name}</div>
                  <div class="text-[10px] font-mono text-slate-400 mt-1 truncate max-w-xs">{item.description || '-'}</div>
                </td>
                <td class="p-3 border-r border-slate-200 hidden md:table-cell">
                  <div class="flex flex-wrap gap-1">
                    {#each item.dietary_tags || [] as tag}
                      {#if DIETARY_META[tag as DietaryTag]}
                        <span class="text-[9px] uppercase font-mono tracking-widest px-1.5 py-0.5 border border-slate-300 text-slate-600 bg-white">
                          {DIETARY_META[tag as DietaryTag].label}
                        </span>
                      {/if}
                    {/each}
                    {#if !item.dietary_tags?.length}
                      <span class="text-slate-300 text-xs">-</span>
                    {/if}
                  </div>
                </td>
                <td class="p-3 border-r border-slate-200 text-right">
                  <div class="font-mono font-medium text-slate-900">{formatCurrency(item.price)}</div>
                  {#if item.happy_hour_discount}
                    <div class="text-[9px] font-mono uppercase tracking-widest text-blue-600 mt-0.5">-{item.happy_hour_discount}%</div>
                  {/if}
                </td>
                <td class="p-3 border-r border-slate-200 text-center">
                  <button 
                    onclick={() => toggleAvailability(item)}
                    class="text-[10px] font-mono uppercase tracking-widest px-2 py-1 border transition-colors {item.is_available ? 'border-green-600 text-green-700 bg-green-50' : 'border-slate-300 text-slate-500 bg-white'}"
                  >
                    {item.is_available ? 'ACTIVE' : 'IDLE'}
                  </button>
                </td>
                <td class="p-2 text-center">
                  <div class="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="p-1.5 border border-slate-200 hover:border-blue-600 hover:text-blue-600 text-slate-400 transition-colors" title="Edit" onclick={() => openEditModal(item)}>
                      <Edit2 size={14} />
                    </button>
                    <button class="p-1.5 border border-slate-200 hover:border-red-600 hover:text-red-600 text-slate-400 transition-colors" title="Delete" onclick={() => deleteItem(item.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>
  </div>
</div>

<!-- Brutalist Edit Modal -->
{#if showModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4" onclick={(e) => { if(e.target === e.currentTarget) showModal = false; }}>
    <div class="bg-white border-2 border-slate-900 w-full max-w-2xl p-6 shadow-[8px_8px_0_0_rgba(15,23,42,1)]" onclick={(e) => e.stopPropagation()}>
      
      <div class="flex justify-between items-center mb-6 border-b-2 border-slate-900 pb-4">
        <div>
          <h2 class="text-lg font-bold uppercase tracking-tight">{editingItemId ? 'Edit Record' : 'Initialize Record'}</h2>
          <p class="text-[10px] font-mono uppercase tracking-widest text-slate-500 mt-1">Menu Dictionary Form</p>
        </div>
        <button class="p-1 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200" onclick={() => showModal = false}><X size={16} /></button>
      </div>
      
      <div class="space-y-4 max-h-[60vh] overflow-y-auto pr-2 font-mono text-sm">
        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2 space-y-1">
            <label class="block text-xs uppercase tracking-widest text-slate-600" for="name">Identifier (Name)</label>
            <input id="name" type="text" class="w-full bg-slate-50 border-2 border-slate-900 p-2 outline-none focus:bg-white transition-colors rounded-none" bind:value={itemForm.name} placeholder="ITEM_NAME" />
          </div>
          <div class="space-y-1">
            <label class="block text-xs uppercase tracking-widest text-slate-600" for="price">Value (INR)</label>
            <input id="price" type="number" step="0.01" class="w-full bg-slate-50 border-2 border-slate-900 p-2 outline-none focus:bg-white transition-colors rounded-none" bind:value={itemForm.price} placeholder="0.00" />
          </div>
          <div class="space-y-1">
            <label class="block text-xs uppercase tracking-widest text-slate-600" for="hh_discount">HH Discount %</label>
            <input id="hh_discount" type="number" step="1" min="0" max="100" class="w-full bg-slate-50 border-2 border-slate-900 p-2 outline-none focus:bg-white transition-colors rounded-none" bind:value={itemForm.happy_hour_discount} placeholder="0" />
          </div>
          <div class="col-span-2 space-y-1">
            <label class="block text-xs uppercase tracking-widest text-slate-600" for="cat">Classification</label>
            <select id="cat" class="w-full bg-slate-50 border-2 border-slate-900 p-2 outline-none focus:bg-white transition-colors rounded-none uppercase" bind:value={itemForm.category_id}>
              <option value="" disabled selected>SELECT...</option>
              {#each categories as cat}
                <option value={cat.id}>{cat.name}</option>
              {/each}
            </select>
          </div>
          
          <div class="col-span-2 space-y-1">
            <label class="block text-xs uppercase tracking-widest text-slate-600" for="img">Asset URL</label>
            <input id="img" type="text" class="w-full bg-slate-50 border-2 border-slate-900 p-2 outline-none focus:bg-white transition-colors rounded-none" bind:value={itemForm.image_url} placeholder="https://..." />
          </div>
          
          <div class="col-span-2 space-y-1 mt-2">
            <span class="block text-xs uppercase tracking-widest text-slate-600 mb-2">Metadata Tags</span>
            <div class="flex flex-wrap gap-2">
              {#each Object.entries(DIETARY_META) as [tag, meta]}
                <button 
                  class="px-2 py-1 text-[10px] uppercase tracking-widest border-2 transition-all rounded-none {itemForm.dietary_tags.includes(tag as DietaryTag) ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-400'}"
                  onclick={() => toggleTag(tag as DietaryTag)}
                >
                  {meta.label}
                </button>
              {/each}
            </div>
          </div>
          
          <div class="col-span-2 space-y-1 mt-2">
            <label class="block text-xs uppercase tracking-widest text-slate-600" for="desc">Description</label>
            <textarea id="desc" class="w-full bg-slate-50 border-2 border-slate-900 p-2 outline-none focus:bg-white transition-colors rounded-none h-24 resize-none" bind:value={itemForm.description} placeholder="Enter details..."></textarea>
          </div>
        </div>
      </div>
      
      <div class="flex gap-2 mt-6 pt-4 border-t-2 border-slate-900">
        <button class="flex-1 py-2 border-2 border-slate-900 bg-white hover:bg-slate-100 uppercase tracking-widest text-xs font-bold transition-colors rounded-none" onclick={() => showModal = false} disabled={isSaving}>Abort</button>
        <button class="flex-1 py-2 border-2 border-slate-900 bg-blue-600 text-white hover:bg-blue-700 uppercase tracking-widest text-xs font-bold transition-colors disabled:opacity-50 flex justify-center items-center gap-2 rounded-none" onclick={saveItem} disabled={isSaving}>
          {#if isSaving}
            <RefreshCw size={14} class="animate-spin" /> EXECUTING...
          {:else}
            COMMIT RECORD
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}
