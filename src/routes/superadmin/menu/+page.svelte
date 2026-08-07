<script lang="ts">
  import { Plus, X, Edit2, Trash2, Settings } from 'lucide-svelte';
  import { formatCurrency } from '$lib/utils';
  import { fade } from 'svelte/transition';
  import { toast } from 'svelte-sonner';
  
  let { data } = $props();
  
  let categories = $state(data.categories || []);
  let items = $state(data.items || []);
  let selectedCategory = $state<string | null>(null);

  let filteredItems = $derived(
    selectedCategory 
      ? items.filter(item => item.category_id === selectedCategory)
      : items
  );

  let showModal = $state(false);
  let editingItem = $state<any>(null);
  let isSaving = $state(false);
  let isLoading = $state(false);

  function getCategoryName(id: string | null) {
    if (!id) return 'Uncategorized';
    return categories.find(c => c.id === id)?.name || 'Unknown Category';
  }

  function openAdd() {
    editingItem = null;
    showModal = true;
  }

  function openEdit(item: any) {
    editingItem = item;
    showModal = true;
  }

  async function saveItem(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    if (editingItem) formData.append('id', editingItem.id);
    
    isSaving = true;
    try {
      const res = await fetch(editingItem ? '?/updateItem' : '?/addItem', {
        method: 'POST',
        body: formData
      });
      
      const result = await res.json();
      if (result.type === 'success') {
        const payload = JSON.parse(result.data);
        const savedItem = payload[0];
        
        if (editingItem) {
          items = items.map(i => i.id === savedItem.id ? savedItem : i);
          toast.success('Item updated');
        } else {
          items = [...items, savedItem];
          toast.success('Item added');
        }
        showModal = false;
      } else {
        toast.error('Failed to save item');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred');
    } finally {
      isSaving = false;
    }
  }

  async function deleteItem(id: string) {
    if (!confirm('Are you sure you want to delete this global item?')) return;
    
    const formData = new FormData();
    formData.append('id', id);
    
    try {
      const res = await fetch('?/deleteItem', {
        method: 'POST',
        body: formData
      });
      
      const result = await res.json();
      if (result.type === 'success') {
        items = items.filter(i => i.id !== id);
        toast.success('Item deleted');
      } else {
        toast.error('Failed to delete item');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred');
    }
  }

  async function toggleAvailability(item: any) {
    const formData = new FormData();
    formData.append('id', item.id);
    formData.append('is_available', (!item.is_available).toString());
    
    try {
      const res = await fetch('?/updateItem', {
        method: 'POST',
        body: formData
      });
      
      const result = await res.json();
      if (result.type === 'success') {
        items = items.map(i => i.id === item.id ? { ...i, is_available: !item.is_available } : i);
        toast.success(item.is_available ? 'Marked unavailable' : 'Marked available');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    }
  }

  import Card from '$lib/components/ui/card.svelte';
  import CardHeader from '$lib/components/ui/card-header.svelte';
  import CardContent from '$lib/components/ui/card-content.svelte';
</script>

<svelte:head>
  <title>Global Menu | Superadmin</title>
</svelte:head>

<div class="flex-1 space-y-4">
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
    <div class="flex items-center gap-4">
      <div class="w-10 h-10 rounded-md bg-zinc-100 flex items-center justify-center border border-zinc-200 text-zinc-900">
        <Settings size={20} />
      </div>
      <div>
        <h2 class="text-3xl font-bold tracking-tight text-zinc-950">Global Menu</h2>
        <p class="text-sm text-zinc-900">Manage standard items deployed across all restaurants.</p>
      </div>
    </div>
    
    <button class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 bg-zinc-900 text-zinc-50 shadow hover:bg-zinc-900/90 h-9 px-4 py-2 gap-2" onclick={openAdd}>
      <Plus size={16} /> Add Item
    </button>
  </div>

  <div class="mb-6 overflow-x-auto pb-2">
    <div class="flex items-center gap-2 min-w-max p-1 rounded-lg bg-zinc-100 border border-zinc-200 inline-flex">
      <button
        class="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 {selectedCategory === null ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-900 hover:text-zinc-900'}"
        onclick={() => selectedCategory = null}
      >All Items</button>
      {#each categories as cat}
        <button
          class="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 {selectedCategory === cat.id ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-900 hover:text-zinc-900'}"
          onclick={() => selectedCategory = cat.id}
        >
          {cat.icon_emoji ?? ''} {cat.name}
        </button>
      {/each}
    </div>
  </div>

  {#if isLoading}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {#each Array(6) as _}
        <div class="h-[280px] rounded-xl border border-zinc-200 bg-zinc-100/50 animate-pulse"></div>
      {/each}
    </div>
  {:else if filteredItems.length === 0}
    <div class="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 p-12 text-center animate-in fade-in-50">
      <div class="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100 mb-4">
        <Settings size={32} class="text-zinc-900" />
      </div>
      <h3 class="mt-4 text-lg font-semibold text-zinc-950">No items found</h3>
      <p class="mb-4 mt-2 text-sm text-zinc-900">Add the first item to this category.</p>
      <button class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 bg-zinc-900 text-zinc-50 shadow hover:bg-zinc-900/90 h-9 px-4 py-2" onclick={openAdd}>
        Add First Item
      </button>
    </div>
  {:else}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {#each filteredItems as item (item.id)}
        <Card class="overflow-hidden flex flex-col transition-all hover:shadow-md">
          <div class="h-[160px] bg-zinc-100 relative overflow-hidden border-b border-zinc-200">
            {#if item.image_url}
              <img src={item.image_url} alt={item.name} class="w-full h-full object-cover" loading="lazy" />
            {:else}
              <div class="flex items-center justify-center h-full text-zinc-300">
                <Settings size={48} />
              </div>
            {/if}
            {#if !item.is_available}
              <div class="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                <span class="inline-flex items-center rounded-full border border-zinc-200 px-2.5 py-0.5 text-xs font-semibold text-zinc-950 bg-white shadow-sm">Out of Stock</span>
              </div>
            {/if}
          </div>
          <CardContent class="p-4 flex-1 flex flex-col pt-4">
            <div class="flex justify-between items-start gap-4 mb-1">
              <h3 class="font-semibold leading-tight text-zinc-950 line-clamp-2">{item.name}</h3>
              <span class="font-bold text-zinc-900 whitespace-nowrap">{formatCurrency(item.price)}</span>
            </div>
            <p class="text-xs text-zinc-900 font-mono mb-4">{getCategoryName(item.category_id ?? null)}</p>
            
            <div class="mt-auto flex items-center gap-2 pt-4">
              <button
                class="inline-flex flex-1 items-center justify-center rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 h-8 px-2 border {item.is_available ? 'border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100' : 'bg-zinc-100 border-zinc-200 text-zinc-900 hover:bg-zinc-200'}"
                onclick={() => toggleAvailability(item)}
              >
                {item.is_available ? 'Available' : 'Unavailable'}
              </button>
              <button
                class="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-900 h-8 w-8 shrink-0"
                onclick={() => openEdit(item)}
              >
                <Edit2 size={14} />
              </button>
              <button
                class="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500 border border-red-200 bg-white hover:bg-red-50 text-red-600 h-8 w-8 shrink-0"
                onclick={() => deleteItem(item.id)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </CardContent>
        </Card>
      {/each}
    </div>
  {/if}
</div>

<!-- Add/Edit Modal -->
{#if showModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div 
    transition:fade={{ duration: 150 }}
    class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" 
    onclick={(e) => { if (e.target === e.currentTarget) showModal = false; }}
  >
    <div class="bg-white rounded-xl border border-zinc-200 shadow-lg w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200" onclick={(e) => e.stopPropagation()}>
      <div class="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50/50">
        <div>
          <h2 class="text-lg font-semibold tracking-tight">{editingItem ? 'Edit Item' : 'Add Menu Item'}</h2>
        </div>
        <button class="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2" onclick={() => showModal = false}>
          <X size={16} class="text-zinc-900" />
        </button>
      </div>

      <form onsubmit={saveItem} class="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
        <div class="space-y-2">
          <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="name">Item Name</label>
          <input class="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50" id="name" name="name" required value={editingItem?.name ?? ''} placeholder="Butter Chicken" />
        </div>
        
        <div class="space-y-2">
          <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="description">Description (Optional)</label>
          <input class="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50" id="description" name="description" value={editingItem?.description ?? ''} placeholder="Creamy tomato-based curry..." />
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="price">Price (₹)</label>
            <input class="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50" id="price" name="price" type="number" step="0.01" required value={editingItem?.price ?? ''} placeholder="350" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="category_id">Category</label>
            <select class="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950" id="category_id" name="category_id">
              <option value="">None</option>
              {#each categories as cat}
                <option value={cat.id} selected={editingItem?.category_id === cat.id}>{cat.name}</option>
              {/each}
            </select>
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="image_url">Image URL</label>
          <input class="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50" id="image_url" name="image_url" type="url" value={editingItem?.image_url ?? ''} placeholder="https://..." />
        </div>
        
        <div class="space-y-2">
          <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="is_available">Availability</label>
          <select class="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950" id="is_available" name="is_available">
            <option value="true" selected={editingItem?.is_available !== false}>Available</option>
            <option value="false" selected={editingItem?.is_available === false}>Out of Stock</option>
          </select>
        </div>

        <div class="flex gap-2 pt-4 mt-6 border-t border-zinc-200">
          <button type="button" onclick={() => showModal = false} class="inline-flex flex-1 items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 border border-zinc-200 bg-white shadow-sm hover:bg-zinc-100 h-9 px-4">
            Cancel
          </button>
          <button type="submit" disabled={isSaving} class="inline-flex flex-1 items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 bg-zinc-900 text-zinc-50 shadow hover:bg-zinc-900/90 h-9 px-4">
            {isSaving ? 'Saving...' : editingItem ? 'Update Item' : 'Add Item'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
