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

<div class="h-full flex flex-col gap-12 animate-fade-in font-sans text-slate-900 pb-16">
  <!-- Editorial Header -->
  <header class="border-b-2 border-slate-900 pb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-6">
    <div class="max-w-2xl">
      <h1 class="text-5xl md:text-6xl font-display font-black tracking-tighter leading-none italic pr-4">Menu<br />Dictionary.</h1>
      <p class="text-sm text-slate-500 mt-6 font-mono uppercase tracking-widest leading-relaxed">
        Global item catalog and classification configuration.
      </p>
    </div>
    
    <div class="flex flex-wrap gap-4 items-center border-l border-slate-200 pl-6 shrink-0">
      {#if restaurants.length > 0}
        <select class="bg-transparent border-b border-slate-300 px-2 py-1 outline-none focus:border-slate-900 transition-colors text-xs font-mono uppercase tracking-widest" bind:value={selectedRestaurantId}>
          {#each restaurants as res}
            <option value={res.id}>{res.name}</option>
          {/each}
        </select>
      {/if}
      <button class="text-xs font-mono uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors disabled:opacity-50" onclick={loadData} disabled={isLoading || !selectedRestaurantId}>
        [ Refresh ]
      </button>
      <button 
        class="text-xs font-mono uppercase tracking-widest text-emerald-600 hover:text-emerald-500 transition-colors disabled:opacity-50"
        onclick={openAddModal}
        disabled={!selectedRestaurantId}
      >
        [ Append Record ]
      </button>
    </div>
  </header>

  <div class="flex-1 flex flex-col lg:flex-row gap-16 overflow-hidden">
    
    <!-- Editorial Category Sidebar -->
    <div class="w-full lg:w-48 flex-shrink-0 flex lg:flex-col overflow-x-auto lg:overflow-y-auto hide-scrollbar gap-4">
      <h3 class="font-display text-2xl font-bold italic text-slate-300 hidden lg:block mb-4">Index</h3>
      
      <div class="relative flex-1 lg:flex-none mb-4 lg:mb-8">
        <input 
          type="text" 
          bind:value={searchQuery} 
          placeholder="SEARCH..." 
          class="w-full bg-transparent border-b border-slate-300 py-1 text-xs font-mono uppercase outline-none focus:border-slate-900 transition-colors placeholder:text-slate-300"
        />
      </div>

      <div class="flex lg:flex-col gap-2">
        <button 
          class="text-left py-2 text-xs font-mono uppercase tracking-widest transition-colors whitespace-nowrap {selectedCategory === null ? 'text-emerald-600 font-bold' : 'text-slate-400 hover:text-slate-900'}"
          onclick={() => selectedCategory = null}
        >
          * All Records
        </button>
        
        {#each categories as category}
          <button 
            class="text-left py-2 text-xs font-mono uppercase tracking-widest transition-colors whitespace-nowrap flex items-center gap-2 {selectedCategory === category.id ? 'text-emerald-600 font-bold' : 'text-slate-400 hover:text-slate-900'}"
            onclick={() => selectedCategory = category.id}
          >
            <span class="opacity-50">{category.icon_emoji || '-'}</span>
            {category.name}
          </button>
        {/each}
      </div>
    </div>

    <!-- Editorial Items Ledger -->
    <div class="flex-1 overflow-y-auto hide-scrollbar">
      {#if isLoading}
        <div class="h-64 flex items-center justify-center">
          <RefreshCw size={24} class="animate-spin text-slate-300" />
        </div>
      {:else if errorMsg}
        <div class="py-24 flex flex-col items-center justify-center text-red-500 font-mono text-sm border-t border-b border-slate-200">
          <p class="font-bold mb-2">ERR_LOAD</p>
          <p class="opacity-80">{errorMsg}</p>
        </div>
      {:else if filteredItems.length === 0}
        <div class="py-24 flex flex-col items-center justify-center text-slate-300 border-t border-b border-slate-200">
          <h3 class="font-display text-3xl font-bold italic mb-2">Empty Section</h3>
          <p class="text-xs font-mono uppercase tracking-widest">0 Records Found</p>
        </div>
      {:else}
        <div class="divide-y divide-slate-100">
          {#each filteredItems as item (item.id)}
            <div class="py-6 flex flex-col sm:flex-row gap-6 group {item.is_available ? '' : 'opacity-50'}">
              
              <div class="w-16 h-16 bg-slate-100 flex items-center justify-center shrink-0">
                {#if item.image_url}
                  <img src={item.image_url} alt="img" class="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                {:else}
                  <ImageIcon size={20} class="text-slate-300" />
                {/if}
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex justify-between items-baseline gap-4 mb-2">
                  <h4 class="text-xl font-display font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">{item.name}</h4>
                  <div class="font-mono text-lg font-medium shrink-0">
                    {formatCurrency(item.price)}
                  </div>
                </div>
                
                <p class="text-xs font-mono text-slate-500 mb-3 max-w-xl line-clamp-2">{item.description || 'No description provided.'}</p>
                
                <div class="flex flex-wrap items-center gap-4 text-[10px] font-mono uppercase tracking-widest">
                  <div class="flex gap-2 text-slate-400">
                    {#each item.dietary_tags || [] as tag}
                      {#if DIETARY_META[tag as DietaryTag]}
                        <span>[{DIETARY_META[tag as DietaryTag].label}]</span>
                      {/if}
                    {/each}
                  </div>
                  
                  {#if item.happy_hour_discount}
                    <span class="text-emerald-600">-{item.happy_hour_discount}% HH</span>
                  {/if}
                </div>
              </div>

              <div class="flex sm:flex-col items-center sm:items-end justify-between gap-4 shrink-0 sm:w-24">
                <button 
                  onclick={() => toggleAvailability(item)}
                  class="text-[10px] font-mono uppercase tracking-widest transition-colors {item.is_available ? 'text-emerald-600 hover:text-emerald-800' : 'text-slate-400 hover:text-slate-600 line-through'}"
                >
                  {item.is_available ? 'Active' : 'Out of Stock'}
                </button>
                
                <div class="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400">
                  <button class="hover:text-slate-900 transition-colors" title="Edit" onclick={() => openEditModal(item)}>
                    <Edit2 size={16} />
                  </button>
                  <button class="hover:text-red-600 transition-colors" title="Delete" onclick={() => deleteItem(item.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- Editorial Edit Modal -->
{#if showModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="fixed inset-0 bg-[#f8f9fa]/95 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onclick={(e) => { if(e.target === e.currentTarget) showModal = false; }}>
    <div class="w-full max-w-2xl bg-white p-12 relative shadow-2xl" onclick={(e) => e.stopPropagation()}>
      
      <div class="flex justify-between items-start mb-10 border-b-2 border-slate-900 pb-6">
        <div>
          <h2 class="text-4xl font-display font-black tracking-tighter italic">{editingItemId ? 'Edit Record.' : 'Initialize.'}</h2>
          <p class="text-xs font-mono uppercase tracking-widest text-slate-500 mt-2">Menu Dictionary Form</p>
        </div>
        <button class="text-slate-400 hover:text-slate-900 transition-colors" onclick={() => showModal = false}><X size={24} strokeWidth={1} /></button>
      </div>
      
      <div class="space-y-8 max-h-[60vh] overflow-y-auto pr-4 font-mono text-sm hide-scrollbar">
        <div class="grid grid-cols-2 gap-8">
          
          <div class="col-span-2 space-y-3">
            <label class="block text-[10px] uppercase tracking-widest text-slate-500" for="name">Identifier (Name)</label>
            <input id="name" type="text" class="w-full bg-transparent border-b border-slate-300 py-2 outline-none focus:border-slate-900 transition-colors placeholder:text-slate-300 text-lg" bind:value={itemForm.name} placeholder="Item Name" />
          </div>

          <div class="space-y-3">
            <label class="block text-[10px] uppercase tracking-widest text-slate-500" for="price">Value (INR)</label>
            <input id="price" type="number" step="0.01" class="w-full bg-transparent border-b border-slate-300 py-2 outline-none focus:border-slate-900 transition-colors placeholder:text-slate-300 text-lg" bind:value={itemForm.price} placeholder="0.00" />
          </div>

          <div class="space-y-3">
            <label class="block text-[10px] uppercase tracking-widest text-slate-500" for="cat">Classification</label>
            <select id="cat" class="w-full bg-transparent border-b border-slate-300 py-2 outline-none focus:border-slate-900 transition-colors text-lg uppercase" bind:value={itemForm.category_id}>
              <option value="" disabled selected>Select...</option>
              {#each categories as cat}
                <option value={cat.id}>{cat.name}</option>
              {/each}
            </select>
          </div>
          
          <div class="col-span-2 space-y-3">
            <label class="block text-[10px] uppercase tracking-widest text-slate-500" for="img">Asset URL</label>
            <input id="img" type="text" class="w-full bg-transparent border-b border-slate-300 py-2 outline-none focus:border-slate-900 transition-colors placeholder:text-slate-300" bind:value={itemForm.image_url} placeholder="https://..." />
          </div>

          <div class="space-y-3">
            <label class="block text-[10px] uppercase tracking-widest text-slate-500" for="hh_discount">HH Discount %</label>
            <input id="hh_discount" type="number" step="1" min="0" max="100" class="w-full bg-transparent border-b border-slate-300 py-2 outline-none focus:border-slate-900 transition-colors placeholder:text-slate-300" bind:value={itemForm.happy_hour_discount} placeholder="0" />
          </div>
          
          <div class="col-span-2 space-y-3 mt-4">
            <span class="block text-[10px] uppercase tracking-widest text-slate-500 mb-4">Metadata Tags</span>
            <div class="flex flex-wrap gap-4">
              {#each Object.entries(DIETARY_META) as [tag, meta]}
                <button 
                  class="text-[10px] uppercase tracking-widest transition-colors {itemForm.dietary_tags.includes(tag as DietaryTag) ? 'text-emerald-600 font-bold border-b border-emerald-600 pb-1' : 'text-slate-400 hover:text-slate-900 pb-1'}"
                  onclick={() => toggleTag(tag as DietaryTag)}
                >
                  [{meta.label}]
                </button>
              {/each}
            </div>
          </div>
          
          <div class="col-span-2 space-y-3 mt-4">
            <label class="block text-[10px] uppercase tracking-widest text-slate-500" for="desc">Description</label>
            <textarea id="desc" class="w-full bg-transparent border border-slate-300 p-4 outline-none focus:border-slate-900 transition-colors h-32 resize-none placeholder:text-slate-300" bind:value={itemForm.description} placeholder="Enter detailed description..."></textarea>
          </div>
        </div>
      </div>
      
      <div class="flex gap-6 mt-10 pt-8 border-t-2 border-slate-900">
        <button class="text-xs font-mono uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors" onclick={() => showModal = false} disabled={isSaving}>[ Abort ]</button>
        <button class="text-xs font-mono uppercase tracking-widest text-emerald-600 hover:text-emerald-500 transition-colors disabled:opacity-50" onclick={saveItem} disabled={isSaving}>
          {#if isSaving}
            [ Executing... ]
          {:else}
            [ Commit Record ]
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}
