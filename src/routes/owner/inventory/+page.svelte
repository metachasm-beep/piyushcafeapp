<script lang="ts">
  import { supabase } from '$lib/supabase';
  import type { MenuItem, MenuCategory } from '$lib/types';
  import { toast } from 'svelte-sonner';
  import { RefreshCw, Search, Plus, X, Image as ImageIcon } from 'lucide-svelte';

  let items = $state<MenuItem[]>([]);
  let categories = $state<MenuCategory[]>([]);
  let ownerRestaurantId = $state<string | null>(null);
  let isLoading = $state(true);
  let searchQuery = $state('');
  let selectedCategory = $state<string | null>(null);
  
  // Add Item Modal State
  let showAddModal = $state(false);
  let isSaving = $state(false);
  let imageFile = $state<File | null>(null);
  let imagePreview = $state<string | null>(null);
  
  let newVariations = $state<{name: string, extra_price: number}[]>([]);
  let newAddons = $state<{name: string, extra_price: number}[]>([]);

  function addVariation() { newVariations.push({ name: '', extra_price: 0 }); }
  function removeVariation(i: number) { newVariations.splice(i, 1); }
  function addAddon() { newAddons.push({ name: '', extra_price: 0 }); }
  function removeAddon(i: number) { newAddons.splice(i, 1); }

  async function loadInventory() {
    isLoading = true;
    try {
      if (!supabase) throw new Error('Supabase not initialized');
      
      // Get the owner's restaurant ID
      const { data: staffData } = await supabase.from('restaurant_staff').select('restaurant_id').limit(1).single();
      if (staffData) {
        ownerRestaurantId = staffData.restaurant_id;
      }
      
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

  async function addItem(e: SubmitEvent) {
    e.preventDefault();
    if (!ownerRestaurantId || !supabase) {
      toast.error("Could not authenticate restaurant");
      return;
    }
    
    isSaving = true;
    const fd = new FormData(e.target as HTMLFormElement);
    
    try {
      let imageUrl = null;
      
      // 1. Upload Image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${ownerRestaurantId}/${fileName}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('menu-images')
          .upload(filePath, imageFile);
          
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('menu-images')
          .getPublicUrl(filePath);
          
        imageUrl = publicUrl;
      }

      // 2. Insert Menu Item
      const newItem = {
        id: crypto.randomUUID(),
        restaurant_id: ownerRestaurantId,
        category_id: fd.get('category_id') as string,
        name: fd.get('name') as string,
        description: fd.get('description') as string,
        price: Number(fd.get('price')),
        image_url: imageUrl,
        is_available: true,
        is_featured: fd.get('is_featured') === 'on',
        dietary_tags: [] // Can be extended later
      };
      
      const { data: itemResp, error: dbError } = await supabase.from('menu_items').insert(newItem).select().single();
      if (dbError) throw dbError;
      
      // 3. Insert Variations & Addons
      if (newVariations.length > 0) {
        const validVars = newVariations.filter(v => v.name.trim() !== '').map((v, idx) => ({
          menu_item_id: itemResp.id,
          name: v.name.trim(),
          extra_price: Number(v.extra_price),
          sort_order: idx
        }));
        if (validVars.length > 0) await supabase.from('menu_item_variations').insert(validVars);
      }
      
      if (newAddons.length > 0) {
        const validAddons = newAddons.filter(a => a.name.trim() !== '').map((a, idx) => ({
          menu_item_id: itemResp.id,
          name: a.name.trim(),
          extra_price: Number(a.extra_price),
          sort_order: idx
        }));
        if (validAddons.length > 0) await supabase.from('menu_item_addons').insert(validAddons);
      }

      // Update UI
      items = [...items, itemResp as unknown as MenuItem];
      toast.success('Item added successfully!');
      
      // Reset Modal
      showAddModal = false;
      imageFile = null;
      imagePreview = null;
      newVariations = [];
      newAddons = [];
      
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to add item');
    } finally {
      isSaving = false;
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
      <h2 class="text-2xl font-bold tracking-tight text-zinc-950">Inventory Management</h2>
      <p class="text-sm text-zinc-500 mt-1">Manage your menu items and stock availability.</p>
    </div>
    <div class="flex items-center gap-3 w-full md:w-auto">
      <div class="relative flex-1 md:w-64">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
        <input 
          type="text" 
          bind:value={searchQuery} 
          placeholder="Search items..." 
          class="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
        />
      </div>
      <button class="p-2 bg-white rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-700 transition-colors" onclick={loadInventory}>
        <RefreshCw size={20} class={isLoading ? 'animate-spin' : ''} />
      </button>
      <button class="px-4 py-2 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800 transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap" onclick={() => showAddModal = true}>
        <Plus size={18} /> Add Item
      </button>
    </div>
  </div>

  <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
    <button 
      class="px-4 py-2 rounded-full whitespace-nowrap transition-colors text-sm font-medium {selectedCategory === null ? 'bg-zinc-900 text-white shadow-sm' : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'}"
      onclick={() => selectedCategory = null}
    >
      All Items
    </button>
    {#each categories as cat}
      <button 
        class="px-4 py-2 rounded-full whitespace-nowrap transition-colors text-sm font-medium {selectedCategory === cat.id ? 'bg-zinc-900 text-white shadow-sm' : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'}"
        onclick={() => selectedCategory = cat.id}
      >
        {cat.name}
      </button>
    {/each}
  </div>

  {#if isLoading && items.length === 0}
    <div class="flex items-center justify-center p-12">
      <div class="w-8 h-8 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
    </div>
  {:else if filteredItems.length === 0}
    <div class="bg-white border border-zinc-200 rounded-xl p-12 text-center text-zinc-500 shadow-sm">
      No items found matching your criteria.
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {#each filteredItems as item}
        <div class="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col gap-3 transition-colors shadow-sm relative overflow-hidden group">
          <div class="flex items-start gap-3">
            <div class="w-16 h-16 rounded-lg bg-zinc-100 flex-shrink-0 relative overflow-hidden">
              {#if item.image_url}
                <img src={item.image_url} alt={item.name} class="w-full h-full object-cover {item.is_available ? '' : 'opacity-40 grayscale'}" />
              {:else}
                <div class="w-full h-full flex items-center justify-center text-zinc-400 text-xs">No Img</div>
              {/if}
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="font-semibold truncate text-zinc-900 {item.is_available ? '' : 'opacity-50'}">{item.name}</h4>
              <p class="text-sm font-medium text-zinc-600 mt-0.5 {item.is_available ? '' : 'opacity-50'}">₹{item.price.toFixed(2)}</p>
            </div>
          </div>
          
          <div class="mt-auto pt-3 border-t border-zinc-100 flex items-center justify-between">
            <span class="text-xs font-semibold {item.is_available ? 'text-emerald-600' : 'text-red-600'}">
              {item.is_available ? 'In Stock' : 'Out of Stock'}
            </span>
            <button 
              class="px-3 py-1.5 rounded-md text-xs font-semibold transition-colors {item.is_available ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}"
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
  <div class="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onclick={(e) => { if (e.target === e.currentTarget) showAddModal = false; }}>
    <div class="bg-white border border-zinc-200 w-full max-w-lg rounded-xl relative shadow-xl my-auto" onclick={(e) => e.stopPropagation()}>
      <div class="p-6 border-b border-zinc-100 flex items-center justify-between sticky top-0 bg-white rounded-t-xl z-10">
        <h2 class="text-xl font-bold text-zinc-950">Add New Menu Item</h2>
        <button class="p-2 bg-zinc-50 hover:bg-zinc-100 rounded-lg text-zinc-500 transition-colors" onclick={() => showAddModal = false}>
          <X size={18} />
        </button>
      </div>
      
      <form onsubmit={addItem} class="p-6 space-y-5">
        
        <!-- Image Upload -->
        <div>
          <label class="block text-sm font-medium text-zinc-700 mb-2" for="image">Item Image</label>
          <div class="flex items-center gap-4">
            <div class="w-24 h-24 rounded-lg border-2 border-dashed border-zinc-200 bg-zinc-50 flex items-center justify-center overflow-hidden relative">
              {#if imagePreview}
                <img src={imagePreview} alt="Preview" class="w-full h-full object-cover" />
              {:else}
                <ImageIcon size={28} class="text-zinc-400" />
              {/if}
              <input type="file" id="image" accept="image/*" onchange={handleImageSelect} class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            </div>
            <div class="flex-1">
              <p class="text-sm font-medium text-zinc-900">Upload a photo</p>
              <p class="text-xs text-zinc-500 mt-1">Recommended size: 500x500px (1:1 ratio). Max 1MB.</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-zinc-700" for="name">Item Name *</label>
            <input id="name" name="name" required placeholder="e.g. Garlic Naan" class="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all" />
          </div>
          
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-zinc-700" for="price">Price (₹) *</label>
            <input id="price" name="price" type="number" step="0.01" min="0" required placeholder="150" class="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all" />
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-zinc-700" for="category_id">Category *</label>
          <select id="category_id" name="category_id" required class="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all appearance-none">
            <option value="" disabled selected>Select a category...</option>
            {#each categories as cat}
              <option value={cat.id}>{cat.name}</option>
            {/each}
          </select>
        </div>

        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-zinc-700" for="description">Description</label>
          <textarea id="description" name="description" rows="2" placeholder="Briefly describe the item..." class="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all resize-none"></textarea>
        </div>

        <div class="pt-4 border-t border-zinc-100">
          <div class="flex items-center justify-between mb-2">
            <span class="block text-sm font-medium text-zinc-900">Variations (e.g. Size, Crust)</span>
            <button type="button" class="text-xs text-zinc-600 font-semibold hover:text-zinc-900 transition-colors" onclick={addVariation}>+ Add Variation</button>
          </div>
          <div class="space-y-2">
            {#each newVariations as v, i}
              <div class="flex gap-2 items-center">
                <input type="text" bind:value={v.name} placeholder="Name (e.g. Large)" class="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all flex-1" />
                <input type="number" bind:value={v.extra_price} placeholder="Extra ₹" class="w-24 px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all" />
                <button type="button" class="text-red-500 hover:text-red-600 p-2" onclick={() => removeVariation(i)}><X size={14}/></button>
              </div>
            {/each}
            {#if newVariations.length === 0}
              <p class="text-xs text-zinc-500 italic">No variations added.</p>
            {/if}
          </div>
        </div>

        <div class="pt-4 border-t border-zinc-100">
          <div class="flex items-center justify-between mb-2">
            <span class="block text-sm font-medium text-zinc-900">Add-ons (e.g. Extra Cheese)</span>
            <button type="button" class="text-xs text-zinc-600 font-semibold hover:text-zinc-900 transition-colors" onclick={addAddon}>+ Add Add-on</button>
          </div>
          <div class="space-y-2">
            {#each newAddons as a, i}
              <div class="flex gap-2 items-center">
                <input type="text" bind:value={a.name} placeholder="Name (e.g. Extra Cheese)" class="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all flex-1" />
                <input type="number" bind:value={a.extra_price} placeholder="Extra ₹" class="w-24 px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all" />
                <button type="button" class="text-red-500 hover:text-red-600 p-2" onclick={() => removeAddon(i)}><X size={14}/></button>
              </div>
            {/each}
            {#if newAddons.length === 0}
              <p class="text-xs text-zinc-500 italic">No add-ons added.</p>
            {/if}
          </div>
        </div>

        <label class="flex items-center gap-3 p-4 border border-zinc-200 rounded-lg bg-zinc-50 cursor-pointer hover:bg-zinc-100 transition-colors mt-4">
          <input type="checkbox" name="is_featured" class="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900" />
          <div>
            <div class="font-medium text-sm text-zinc-900">Feature this item</div>
            <div class="text-xs text-zinc-500">Highlight it on the customer menu.</div>
          </div>
        </label>

        <div class="pt-4 border-t border-zinc-100 flex gap-3">
          <button type="button" class="flex-1 py-2.5 px-4 rounded-lg font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 transition-colors text-sm" onclick={() => showAddModal = false}>
            Cancel
          </button>
          <button type="submit" disabled={isSaving} class="flex-1 py-2.5 px-4 rounded-lg font-medium bg-zinc-900 text-white hover:bg-zinc-800 transition-colors shadow-sm flex justify-center items-center gap-2 text-sm">
            {#if isSaving}
              <div class="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> Adding...
            {:else}
              Add Item
            {/if}
          </button>
        </div>

      </form>
    </div>
  </div>
{/if}
