<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { formatCurrency, DIETARY_META } from '$lib/utils';
  import { toast } from 'svelte-sonner';
  import { Plus, Search, Edit2, Trash2, RefreshCw, Save, X } from 'lucide-svelte';
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
      toast.error('FAILED: ' + error.message);
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
      errorMsg = e.message || 'FAILED TO LOAD DATA';
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
      errorMsg = 'SUPABASE NOT INIT';
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
      toast.error('FAILED TO UPDATE');
    } else {
      const idx = items.findIndex(i => i.id === item.id);
      if (idx !== -1) items[idx].is_available = newStatus;
    }
  }

  async function deleteItem(id: string) {
    if (!supabase) return;
    if (confirm('CONFIRM DELETION?')) {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (error) {
        toast.error('FAILED TO DELETE');
      } else {
        items = items.filter(i => i.id !== id);
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
      toast.error('MISSING REQUIRED FIELDS');
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
      } else {
        const { data, error } = await supabase.from('menu_items').insert(payload).select().single();
        if (error) throw error;
        items = [data, ...items];
      }
      showModal = false;
    } catch (e: any) {
      toast.error('SAVE FAILED');
    } finally {
      isSaving = false;
    }
  }
</script>

<svelte:head>
  <title>DATA CATALOG</title>
</svelte:head>

<div class="h-full flex flex-col font-mono text-text-primary uppercase">
  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border pb-4 mb-4 gap-4">
    <div>
      <h1 class="text-2xl font-bold tracking-widest">Data Catalog</h1>
      <p class="text-xs text-text-secondary mt-1 tracking-wide">Menu Records DB</p>
    </div>
    
    <div class="flex flex-wrap gap-2 w-full sm:w-auto items-center text-xs">
      {#if restaurants.length > 0}
        <select class="bg-transparent border border-border px-2 py-1 outline-none uppercase" bind:value={selectedRestaurantId}>
          {#each restaurants as res}
            <option value={res.id}>{res.name}</option>
          {/each}
        </select>
      {/if}
      <div class="relative flex-1 sm:w-48">
        <input 
          type="text" 
          bind:value={searchQuery} 
          placeholder="QUERY..." 
          class="bg-transparent border border-border w-full px-2 py-1 outline-none uppercase placeholder:text-text-secondary/50 focus:border-brand"
        />
      </div>
      <button 
        class="border border-brand text-brand hover:bg-brand hover:text-black px-4 py-1 flex items-center gap-2 transition-colors disabled:opacity-50"
        onclick={openAddModal}
        disabled={!selectedRestaurantId}
      >
        <Plus size={14} /> ADD ROW
      </button>
      <button class="border border-border p-1 hover:bg-surface disabled:opacity-50" onclick={loadData} disabled={isLoading || !selectedRestaurantId}>
        <RefreshCw size={14} class={isLoading ? 'animate-spin' : ''} />
      </button>
    </div>
  </div>

  <div class="flex-1 flex flex-col lg:flex-row border border-border">
    <!-- Category Sidebar -->
    <div class="w-full lg:w-48 flex-shrink-0 flex flex-col border-b lg:border-b-0 lg:border-r border-border overflow-y-auto bg-surface">
      <div class="p-2 border-b border-border text-[10px] text-text-secondary tracking-widest font-bold">
        FILTERS
      </div>
      <button 
        class="text-left px-4 py-2 text-xs border-b border-border/50 {selectedCategory === null ? 'bg-brand text-black font-bold' : 'hover:bg-card text-text-secondary'}"
        onclick={() => selectedCategory = null}
      >
        ALL RECORDS
      </button>
      
      {#each categories as category}
        <button 
          class="text-left px-4 py-2 text-xs border-b border-border/50 {selectedCategory === category.id ? 'bg-brand text-black font-bold' : 'hover:bg-card text-text-secondary'}"
          onclick={() => selectedCategory = category.id}
        >
          {category.name}
        </button>
      {/each}
    </div>

    <!-- Items Grid (Data Table) -->
    <div class="flex-1 overflow-y-auto bg-black">
      {#if isLoading}
        <div class="h-full flex items-center justify-center">
          <RefreshCw size={24} class="animate-spin text-brand opacity-50" />
        </div>
      {:else if errorMsg}
        <div class="h-full flex flex-col items-center justify-center text-red-500 p-6 text-center text-xs">
          <p class="font-bold">ERR: {errorMsg}</p>
        </div>
      {:else if filteredItems.length === 0}
        <div class="h-full flex flex-col items-center justify-center text-text-secondary text-xs tracking-widest">
          NO RECORDS FOUND.
        </div>
      {:else}
        <table class="w-full text-left border-collapse text-xs">
          <thead class="sticky top-0 bg-surface z-10 border-b border-border">
            <tr class="text-[10px] text-text-secondary tracking-widest">
              <th class="p-2 font-normal w-12 border-r border-border">ID</th>
              <th class="p-2 font-normal border-r border-border">NAME</th>
              <th class="p-2 font-normal w-24 border-r border-border text-right">PRICE</th>
              <th class="p-2 font-normal w-32 border-r border-border">TAGS</th>
              <th class="p-2 font-normal w-24 border-r border-border text-center">STATUS</th>
              <th class="p-2 font-normal w-24 text-center">CMD</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border/30">
            {#each filteredItems as item (item.id)}
              <tr class="hover:bg-surface/30 {item.is_available ? '' : 'text-text-secondary/50'}">
                <td class="p-2 border-r border-border/30 font-mono text-[10px] truncate max-w-[48px]">{item.id.slice(0, 4)}</td>
                <td class="p-2 border-r border-border/30">
                  <div class="font-bold text-brand truncate max-w-[200px]">{item.name}</div>
                  <div class="text-[10px] text-text-secondary truncate max-w-[200px] mt-0.5">{item.description || 'N/A'}</div>
                </td>
                <td class="p-2 border-r border-border/30 text-right font-mono">
                  {formatCurrency(item.price)}
                  {#if item.happy_hour_discount}
                    <div class="text-[9px] text-green-500 mt-0.5">-{item.happy_hour_discount}%</div>
                  {/if}
                </td>
                <td class="p-2 border-r border-border/30">
                  <div class="flex flex-wrap gap-1">
                    {#each item.dietary_tags || [] as tag}
                      {#if DIETARY_META[tag as DietaryTag]}
                        <span class="text-[8px] font-bold px-1 rounded-none border" style="border-color: {DIETARY_META[tag as DietaryTag].color}; color: {DIETARY_META[tag as DietaryTag].color}">
                          {tag}
                        </span>
                      {/if}
                    {/each}
                  </div>
                </td>
                <td class="p-2 border-r border-border/30 text-center">
                  <button 
                    class="text-[10px] font-bold px-2 py-0.5 border {item.is_available ? 'border-green-500 text-green-500 hover:bg-green-500 hover:text-black' : 'border-text-secondary text-text-secondary hover:border-white hover:text-white'}"
                    onclick={() => toggleAvailability(item)}
                  >
                    {item.is_available ? 'ONLINE' : 'OFFLINE'}
                  </button>
                </td>
                <td class="p-2 text-center">
                  <div class="flex gap-2 justify-center">
                    <button class="text-text-secondary hover:text-white" onclick={() => openEditModal(item)}>
                      <Edit2 size={14} />
                    </button>
                    <button class="text-text-secondary hover:text-red-500" onclick={() => deleteItem(item.id)}>
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

<!-- Brutalist Modal -->
{#if showModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 font-mono uppercase text-xs animate-fade-in" onclick={(e) => { if(e.target === e.currentTarget) showModal = false; }}>
    <div class="bg-black border border-brand w-full max-w-2xl shadow-[0_0_15px_var(--color-brand)] max-h-[90vh] flex flex-col" onclick={(e) => e.stopPropagation()}>
      <div class="flex justify-between items-center p-3 bg-brand text-black">
        <h2 class="font-bold tracking-widest">{editingItemId ? 'EDIT RECORD' : 'NEW RECORD'}</h2>
        <button class="hover:bg-black hover:text-brand p-1" onclick={() => showModal = false}>
          <X size={16} />
        </button>
      </div>
      
      <div class="p-6 space-y-4 overflow-y-auto text-text-primary">
        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2 flex flex-col gap-1">
            <label class="text-[10px] text-text-secondary tracking-widest" for="name">NAME</label>
            <input id="name" type="text" class="bg-transparent border border-border p-2 outline-none focus:border-brand" bind:value={itemForm.name} />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-[10px] text-text-secondary tracking-widest" for="price">PRICE</label>
            <input id="price" type="number" step="0.01" class="bg-transparent border border-border p-2 outline-none focus:border-brand" bind:value={itemForm.price} />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-[10px] text-text-secondary tracking-widest" for="hh_discount">HH DISCOUNT %</label>
            <input id="hh_discount" type="number" step="1" min="0" max="100" class="bg-transparent border border-border p-2 outline-none focus:border-brand" bind:value={itemForm.happy_hour_discount} />
          </div>
          <div class="col-span-2 flex flex-col gap-1">
            <label class="text-[10px] text-text-secondary tracking-widest" for="cat">CATEGORY</label>
            <select id="cat" class="bg-black border border-border p-2 outline-none focus:border-brand" bind:value={itemForm.category_id}>
              <option value="" disabled selected>SELECT...</option>
              {#each categories as cat}
                <option value={cat.id}>{cat.name}</option>
              {/each}
            </select>
          </div>
          <div class="col-span-2 flex flex-col gap-1">
            <label class="text-[10px] text-text-secondary tracking-widest" for="img">IMAGE URL (OPTIONAL)</label>
            <input id="img" type="text" class="bg-transparent border border-border p-2 outline-none focus:border-brand" bind:value={itemForm.image_url} />
          </div>
          <div class="col-span-2 flex flex-col gap-1">
            <span class="text-[10px] text-text-secondary tracking-widest">DIETARY TAGS</span>
            <div class="flex flex-wrap gap-2 mt-1">
              {#each Object.entries(DIETARY_META) as [tag, meta]}
                <button 
                  class="px-2 py-1 text-[10px] font-bold border transition-colors {itemForm.dietary_tags.includes(tag as DietaryTag) ? 'bg-surface' : 'opacity-50 hover:opacity-100'}"
                  style="border-color: {meta.color}; color: {meta.color}"
                  onclick={() => toggleTag(tag as DietaryTag)}
                >
                  {tag}
                </button>
              {/each}
            </div>
          </div>
          <div class="col-span-2 flex flex-col gap-1">
            <label class="text-[10px] text-text-secondary tracking-widest" for="desc">DESCRIPTION</label>
            <textarea id="desc" class="bg-transparent border border-border p-2 h-20 outline-none focus:border-brand resize-none" bind:value={itemForm.description}></textarea>
          </div>
        </div>
      </div>
      
      <div class="flex border-t border-border mt-auto">
        <button class="flex-1 py-3 text-center border-r border-border hover:bg-surface text-text-secondary" onclick={() => showModal = false} disabled={isSaving}>ABORT</button>
        <button class="flex-1 py-3 text-center bg-brand text-black font-bold hover:bg-brand/80 disabled:opacity-50" onclick={saveItem} disabled={isSaving}>
          {isSaving ? 'EXECUTING...' : 'COMMIT'}
        </button>
      </div>
    </div>
  </div>
{/if}
