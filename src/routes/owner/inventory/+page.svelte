<script lang="ts">
  import { supabase } from '$lib/supabase';
  import type { MenuItem, MenuCategory } from '$lib/types';
  import { toast } from 'svelte-sonner';
  import { RefreshCw, Search, Plus, X, Image as ImageIcon } from 'lucide-svelte';
  import { fade, scale, fly } from 'svelte/transition';
  import { backOut } from 'svelte/easing';

  import { deserialize, enhance } from '$app/forms';

  let { data } = $props();
  let restaurant = $derived(data.restaurant);

  let items = $state<MenuItem[]>(data.items as MenuItem[] || []);
  let categories = $state<MenuCategory[]>(data.categories as MenuCategory[] || []);
  let isLoading = $state(false);
  let searchQuery = $state('');
  let selectedCategory = $state<string | null>(null);
  
  // Add Item Modal State
  let showAddModal = $state(false);
  let isSaving = $state(false);
  let imageFile = $state<File | null>(null);
  let imagePreview = $state<string | null>(null);
  
  let newVariations = $state<{name: string, extra_price: number}[]>([]);
  let newAddons = $state<{name: string, extra_price: number}[]>([]);
  
  // Category inline creation state
  let selectedModalCategoryId = $state<string>('');
  let isAddingCategory = $state(false);
  let newCategoryName = $state('');

  function addVariation() { newVariations.push({ name: '', extra_price: 0 }); }
  function removeVariation(i: number) { newVariations.splice(i, 1); }
  function addAddon() { newAddons.push({ name: '', extra_price: 0 }); }
  function removeAddon(i: number) { newAddons.splice(i, 1); }

  function handleCategoryChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    if (select.value === 'ADD_NEW') {
      isAddingCategory = true;
    }
  }

  async function handleAddCategory() {
    if (!newCategoryName.trim()) {
      isAddingCategory = false;
      selectedModalCategoryId = '';
      return;
    }

    const formData = new FormData();
    formData.append('name', newCategoryName.trim());
    formData.append('sort_order', categories.length.toString());

    const response = await fetch('?/addCategory', {
      method: 'POST',
      body: formData,
      headers: {
        'x-sveltekit-action': 'true'
      }
    });
    
    const result = deserialize(await response.text()) as any;
    
    if (result.type === 'success' && result.data?.category) {
      const newCat = result.data.category as MenuCategory;
      categories = [...categories, newCat];
      selectedModalCategoryId = newCat.id;
      toast.success('Category added successfully!');
    } else {
      toast.error(result.data?.error || 'Failed to add category');
      selectedModalCategoryId = '';
    }
    
    isAddingCategory = false;
    newCategoryName = '';
  }

  async function toggleAvailability(item: MenuItem) {
    const newValue = !item.is_available;
    const idx = items.findIndex(i => i.id === item.id);
    if (idx !== -1) items[idx] = { ...item, is_available: newValue };
    
    if (!supabase) return;
    const { error } = await supabase.from('menu_items').update({ is_available: newValue }).eq('id', item.id);
      
    if (error) {
      toast.error(`Failed to update ${item.name}`);
      if (idx !== -1) items[idx] = { ...item, is_available: !newValue };
    } else {
      toast.success(`${item.name} marked as ${newValue ? 'In Stock' : 'Out of Stock'}`);
    }
  }

  function handleImageSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.size > 1 * 1024 * 1024) {
        toast.error('Image exceeds 1MB limit. Please choose a smaller file.');
        input.value = '';
        imageFile = null;
        imagePreview = null;
        return;
      }
      imageFile = file;
      imagePreview = URL.createObjectURL(imageFile);
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

<div class="max-w-7xl mx-auto space-y-6 pb-12">
  <!-- Header -->
  <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-zinc-200" in:fly={{ y: 10, duration: 400 }}>
    <div>
      <h1 class="text-3xl font-bold tracking-tight text-zinc-950">Inventory</h1>
      <p class="text-sm font-medium text-zinc-500 mt-1">Manage stock and menu availability.</p>
    </div>
    <div class="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
      <div class="relative w-full sm:w-64 group">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" size={16} />
        <input 
          type="text" 
          bind:value={searchQuery} 
          placeholder="Search items..." 
          class="w-full pl-9 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all shadow-inner text-zinc-900 placeholder:text-zinc-400"
        />
      </div>
      <button class="hidden sm:flex p-2.5 bg-zinc-50 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-700 transition-colors shadow-sm active:scale-95" onclick={() => location.reload()}>
        <RefreshCw size={18} class={isLoading ? 'animate-spin' : ''} />
      </button>
      <button class="w-full sm:w-auto px-5 py-2.5 bg-zinc-950 text-white rounded-xl font-bold tracking-tight hover:bg-zinc-800 transition-all shadow-sm flex items-center justify-center gap-2 whitespace-nowrap active:scale-95" onclick={() => showAddModal = true}>
        <Plus size={18} /> Add Item
      </button>
    </div>
  </div>

  <!-- Filters -->
  <div class="flex gap-2 overflow-x-auto pb-3 pt-1 px-1 -mx-1 scrollbar-hide" in:fly={{ y: 10, duration: 400, delay: 50 }}>
    <button 
      class="px-5 py-2 rounded-full whitespace-nowrap transition-all text-xs font-bold uppercase tracking-widest {selectedCategory === null ? 'bg-zinc-900 text-white shadow-md scale-100' : 'bg-white border border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 scale-95 hover:scale-100'}"
      onclick={() => selectedCategory = null}
    >
      All Items
    </button>
    {#each categories as cat}
      <div class="relative group flex items-center shrink-0">
        <button 
          class="px-5 py-2 rounded-full whitespace-nowrap transition-all text-xs font-bold uppercase tracking-widest {selectedCategory === cat.id ? 'bg-zinc-900 text-white shadow-md scale-100' : 'bg-white border border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 scale-95 hover:scale-100'}"
          onclick={() => selectedCategory = cat.id}
        >
          {cat.name}
        </button>
        {#if selectedCategory === cat.id}
          <form method="POST" action="?/deleteCategory" use:enhance={() => {
            if (!confirm('Are you sure you want to delete this category? Items inside will become uncategorized.')) return ({ update }) => update({ reset: false });
            return async ({ result, update }) => {
              if (result.type === 'success') {
                toast.success('Category deleted');
                categories = categories.filter(c => c.id !== cat.id);
                items = items.map(i => i.category_id === cat.id ? { ...i, category_id: null } : i);
                selectedCategory = null;
              } else {
                toast.error((result.data?.error as string) || 'Failed to delete category');
              }
            };
          }}>
            <input type="hidden" name="category_id" value={cat.id} />
            <button type="submit" class="absolute -top-1 -right-1 w-5 h-5 bg-red-100 text-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-200 hover:text-red-700 transition-all shadow-sm z-10" title="Delete category">
              <X size={12} strokeWidth={3} />
            </button>
          </form>
        {/if}
      </div>
    {/each}
  </div>

  <!-- Items Grid -->
  {#if isLoading && items.length === 0}
    <div class="flex items-center justify-center p-24">
      <div class="w-8 h-8 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></div>
    </div>
  {:else if filteredItems.length === 0}
    <div class="bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-2xl p-16 text-center text-zinc-500 shadow-inner flex flex-col items-center justify-center" in:fade>
      <div class="w-12 h-12 bg-white rounded-xl shadow-sm border border-zinc-100 flex items-center justify-center mb-4">
        <Search class="text-zinc-400" size={20} />
      </div>
      <p class="font-bold text-zinc-900">No items found</p>
      <p class="text-xs mt-1">Try adjusting your search or category filter.</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {#each filteredItems as item, i (item.id)}
        <div in:fly={{ y: 20, duration: 400, delay: i * 50 }} class="bg-white border border-zinc-200 rounded-2xl p-4 flex flex-col transition-all hover:shadow-md group {item.is_available ? '' : 'bg-zinc-50/50'}">
          <div class="flex items-start gap-4">
            <div class="w-20 h-20 rounded-xl flex-shrink-0 relative overflow-hidden shadow-sm border border-zinc-100 bg-zinc-950 flex items-center justify-center {item.is_available ? '' : 'opacity-50 grayscale'}">
              {#if item.image_url}
                <img src={item.image_url} alt={item.name} class="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" />
              {:else}
                <!-- Monochromatic Typographic Fallback -->
                <div class="w-full h-full flex items-center justify-center text-white font-serif text-3xl opacity-80 mix-blend-screen">
                  {item.name.charAt(0).toUpperCase()}
                </div>
              {/if}
            </div>
            <div class="flex-1 min-w-0 pt-1">
              <h4 class="font-bold tracking-tight truncate text-zinc-950 {item.is_available ? '' : 'opacity-60'}">{item.name}</h4>
              <p class="text-xs font-bold text-zinc-500 mt-1 uppercase tracking-widest {item.is_available ? '' : 'opacity-60'}">₹{item.price.toFixed(2)}</p>
            </div>
          </div>
          
          <div class="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between">
            <span class="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 {item.is_available ? 'text-emerald-600' : 'text-red-500'}">
              <span class="w-1.5 h-1.5 rounded-full {item.is_available ? 'bg-emerald-500' : 'bg-red-500'}"></span>
              {item.is_available ? 'Active' : 'Out of Stock'}
            </span>
            <!-- Tactile Toggle Button -->
            <button 
              class="relative overflow-hidden px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all active:scale-90 {item.is_available ? 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200' : 'bg-zinc-950 text-white hover:bg-zinc-800'}"
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

<!-- Add Item Modal -->
{#if showAddModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="fixed inset-0 bg-zinc-950/60 backdrop-blur-md z-50 overflow-y-auto p-4" transition:fade={{ duration: 200 }} onclick={(e) => { if (e.target === e.currentTarget) showAddModal = false; }}>
    <div class="bg-white border border-zinc-200 w-full max-w-xl rounded-2xl relative shadow-2xl mx-auto my-4 sm:my-12" transition:scale={{ duration: 400, easing: backOut, start: 0.95 }} onclick={(e) => e.stopPropagation()}>
      <div class="p-6 border-b border-zinc-100 flex items-center justify-between bg-white rounded-t-2xl">
        <h2 class="text-xl font-bold tracking-tight text-zinc-950">Add Menu Item</h2>
        <button class="w-8 h-8 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 rounded-full text-zinc-600 transition-colors active:scale-90" onclick={() => showAddModal = false}>
          <X size={16} />
        </button>
      </div>
      
      <form 
        method="POST" 
        action="?/addItem"
        enctype="multipart/form-data"
        use:enhance={({ formData }) => {
          isSaving = true;
          if (newVariations.length > 0) formData.append('variations', JSON.stringify(newVariations));
          if (newAddons.length > 0) formData.append('addons', JSON.stringify(newAddons));
          
          return async ({ result, update }) => {
            isSaving = false;
            if (result.type === 'success') {
              toast.success('Item added successfully!');
              if (result.data?.item) {
                items = [...items, result.data.item as MenuItem];
              }
              showAddModal = false;
              imageFile = null;
              imagePreview = null;
              newVariations = [];
              newAddons = [];
            } else if (result.type === 'failure') {
              toast.error(result.data?.error || 'Failed to add item');
            }
          };
        }}
        class="flex flex-col p-6"
      >
        
        <!-- Image Upload -->
        <div class="mb-8">
          <label class="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3" for="image">Item Image</label>
          <div class="flex items-center gap-5">
            <div class="w-24 h-24 rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 flex items-center justify-center overflow-hidden relative group hover:border-zinc-400 transition-colors">
              {#if imagePreview}
                <img src={imagePreview} alt="Preview" class="w-full h-full object-cover" />
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span class="text-white text-[10px] font-bold uppercase tracking-widest">Change</span>
                </div>
              {:else}
                <div class="flex flex-col items-center text-zinc-400 group-hover:text-zinc-600 transition-colors">
                  <ImageIcon size={24} class="mb-1" />
                  <span class="text-[10px] font-bold uppercase tracking-widest">Upload</span>
                </div>
              {/if}
              <input type="file" id="image" name="image" accept="image/*" onchange={handleImageSelect} class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            </div>
            <div class="flex-1">
              <p class="text-sm font-bold text-zinc-900">High-Resolution Photo</p>
              <p class="text-xs text-zinc-500 mt-1 font-medium leading-relaxed">Square 1:1 ratio works best.<br/>Maximum file size: 1MB.</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div class="space-y-2">
            <label class="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest" for="name">Item Name *</label>
            <input id="name" name="name" required placeholder="e.g. Garlic Naan" class="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all shadow-inner" />
          </div>
          
          <div class="space-y-2">
            <label class="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest" for="price">Price (₹) *</label>
            <input id="price" name="price" type="number" step="0.01" min="0" required placeholder="150" class="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all shadow-inner" />
          </div>
        </div>

        <div class="space-y-2 mb-6">
          <label class="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest" for="category_id">Category *</label>
          {#if isAddingCategory}
            <div class="flex gap-2">
              <input type="text" bind:value={newCategoryName} onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); } }} placeholder="New Category (e.g. Desserts)" class="flex-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all shadow-inner" autofocus />
              <button type="button" onclick={handleAddCategory} class="px-5 py-3 bg-zinc-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors shadow-sm active:scale-95">Save</button>
              <button type="button" onclick={() => { isAddingCategory = false; selectedModalCategoryId = ''; }} class="px-5 py-3 bg-white border border-zinc-200 text-zinc-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-50 transition-colors shadow-sm active:scale-95">Cancel</button>
            </div>
          {:else}
            <select id="category_id" name="category_id" bind:value={selectedModalCategoryId} onchange={handleCategoryChange} required class="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all shadow-inner appearance-none cursor-pointer">
              <option value="" disabled selected class="text-zinc-400">Select a category...</option>
              {#each categories as cat}
                <option value={cat.id}>{cat.name}</option>
              {/each}
              <option value="ADD_NEW" class="font-bold text-zinc-900">➕ Create New Category</option>
            </select>
          {/if}
        </div>

        <div class="space-y-3 mb-6">
          <label class="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Dietary Preference</label>
          <div class="flex gap-6">
            <label class="flex items-center gap-2 cursor-pointer group">
              <input type="radio" name="dietary" value="" checked class="w-4 h-4 text-zinc-900 border-zinc-300 focus:ring-zinc-900" />
              <span class="text-sm font-bold text-zinc-700 group-hover:text-zinc-900">Unspecified</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer group">
              <input type="radio" name="dietary" value="veg" class="w-4 h-4 text-emerald-600 border-zinc-300 focus:ring-emerald-600" />
              <span class="text-sm font-bold text-emerald-700 group-hover:text-emerald-800 flex items-center gap-1.5">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="0.5" y="0.5" width="15" height="15" rx="3.5" stroke="#10B981" stroke-width="1"/>
                  <circle cx="8" cy="8" r="4" fill="#10B981"/>
                </svg> Veg
              </span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer group">
              <input type="radio" name="dietary" value="non_veg" class="w-4 h-4 text-red-700 border-zinc-300 focus:ring-red-700" />
              <span class="text-sm font-bold text-red-700 group-hover:text-red-800 flex items-center gap-1.5">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="0.5" y="0.5" width="15" height="15" rx="3.5" stroke="#B91C1C" stroke-width="1"/>
                  <polygon points="8,4 12,11 4,11" fill="#B91C1C"/>
                </svg> Non-Veg
              </span>
            </label>
          </div>
        </div>

        <div class="space-y-2 mb-8">
          <label class="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest" for="description">Description</label>
          <textarea id="description" name="description" rows="2" placeholder="Briefly describe the item..." class="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all shadow-inner resize-none"></textarea>
        </div>

        <div class="mb-8">
          <div class="flex items-center justify-between mb-4">
            <span class="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Variations</span>
            <button type="button" class="text-[10px] text-zinc-900 font-bold uppercase tracking-widest hover:text-zinc-600 transition-colors" onclick={addVariation}>+ Add</button>
          </div>
          <div class="space-y-3">
            {#each newVariations as v, i}
              <div class="flex gap-2 items-center" transition:fly={{ y: -10, duration: 200 }}>
                <input type="text" bind:value={v.name} placeholder="e.g. Large" class="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-bold text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all shadow-inner flex-1" />
                <input type="number" bind:value={v.extra_price} placeholder="Extra ₹" class="w-24 px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-bold text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all shadow-inner" />
                <button type="button" class="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors active:scale-90" onclick={() => removeVariation(i)}><X size={16}/></button>
              </div>
            {/each}
            {#if newVariations.length === 0}
              <div class="py-4 border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50 flex items-center justify-center">
                <p class="text-[10px] font-bold uppercase tracking-widest text-zinc-400">No variations configured</p>
              </div>
            {/if}
          </div>
        </div>

        <div class="mb-8">
          <div class="flex items-center justify-between mb-4">
            <span class="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Add-ons</span>
            <button type="button" class="text-[10px] text-zinc-900 font-bold uppercase tracking-widest hover:text-zinc-600 transition-colors" onclick={addAddon}>+ Add</button>
          </div>
          <div class="space-y-3">
            {#each newAddons as a, i}
              <div class="flex gap-2 items-center" transition:fly={{ y: -10, duration: 200 }}>
                <input type="text" bind:value={a.name} placeholder="e.g. Extra Cheese" class="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-bold text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all shadow-inner flex-1" />
                <input type="number" bind:value={a.extra_price} placeholder="Extra ₹" class="w-24 px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-bold text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all shadow-inner" />
                <button type="button" class="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors active:scale-90" onclick={() => removeAddon(i)}><X size={16}/></button>
              </div>
            {/each}
            {#if newAddons.length === 0}
              <div class="py-4 border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50 flex items-center justify-center">
                <p class="text-[10px] font-bold uppercase tracking-widest text-zinc-400">No add-ons configured</p>
              </div>
            {/if}
          </div>
        </div>

        <div class="pt-6 border-t border-zinc-100 flex gap-4 mt-2">
          <button type="button" class="flex-1 py-3 px-4 rounded-xl font-bold uppercase tracking-widest text-xs text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 transition-colors active:scale-95" onclick={() => showAddModal = false}>
            Cancel
          </button>
          <button type="submit" disabled={isSaving} class="flex-1 py-3 px-4 rounded-xl font-bold uppercase tracking-widest text-xs bg-zinc-950 text-white hover:bg-zinc-800 transition-colors shadow-md flex justify-center items-center gap-2 active:scale-95">
            {#if isSaving}
              <div class="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> Saving...
            {:else}
              Publish Item
            {/if}
          </button>
        </div>

      </form>
    </div>
  </div>
{/if}
