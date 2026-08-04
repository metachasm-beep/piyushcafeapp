<script lang="ts">
  import { MOCK_CATEGORIES, MOCK_MENU_ITEMS } from '$lib/mock-data';
  import { formatCurrency, DIETARY_META } from '$lib/utils';
  import { toast } from 'svelte-sonner';
  import { Plus, Search, Edit2, Trash2, Image as ImageIcon, UtensilsCrossed } from '@lucide/svelte';
  import type { MenuItem } from '$lib/types';

  let items = $state<MenuItem[]>([...MOCK_MENU_ITEMS]);
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

  function toggleAvailability(item: MenuItem) {
    const idx = items.findIndex(i => i.id === item.id);
    if (idx !== -1) {
      items[idx].is_available = !items[idx].is_available;
      toast.success(`${item.name} marked as ${items[idx].is_available ? 'available' : 'unavailable'}`);
    }
  }

  function deleteItem(id: string) {
    if (confirm('Are you sure you want to delete this item?')) {
      items = items.filter(i => i.id !== id);
      toast.success('Item deleted successfully');
    }
  }
  
  let showModal = $state(false);
</script>

<div class="h-full flex flex-col gap-6">
  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <div>
      <h1 class="text-3xl font-display font-bold text-[var(--color-text-primary)]">Menu Manager</h1>
      <p class="text-[var(--color-text-secondary)] mt-1">Manage categories and menu items</p>
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
    </div>
  </div>

  <div class="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
    <!-- Categories Sidebar -->
    <div class="w-full lg:w-64 flex-shrink-0 flex flex-col gap-4">
      <div class="glass-strong p-4 rounded-xl">
        <h3 class="font-bold mb-4 uppercase tracking-wider text-sm text-[var(--color-text-secondary)]">Categories</h3>
        <div class="space-y-1">
          <button 
            class="w-full text-left px-3 py-2 rounded-lg transition-colors {selectedCategory === null ? 'bg-[var(--color-brand)]/20 text-[var(--color-brand)] font-medium' : 'hover:bg-[var(--color-card)]'}"
            onclick={() => selectedCategory = null}
          >
            All Items
          </button>
          {#each MOCK_CATEGORIES as category}
            <button 
              class="w-full text-left px-3 py-2 rounded-lg transition-colors {selectedCategory === category.id ? 'bg-[var(--color-brand)]/20 text-[var(--color-brand)] font-medium' : 'hover:bg-[var(--color-card)]'}"
              onclick={() => selectedCategory = category.id}
            >
              {category.name}
            </button>
          {/each}
        </div>
        <button class="w-full mt-4 py-2 border border-dashed border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-text-secondary)] transition-colors flex items-center justify-center gap-2">
          <Plus size={16} /> Add Category
        </button>
      </div>
    </div>

    <!-- Items Grid -->
    <div class="flex-1 overflow-y-auto pb-12 pr-2">
      {#if filteredItems.length === 0}
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
                  <button class="p-1.5 bg-black/60 hover:bg-[var(--color-brand)] rounded text-white backdrop-blur-sm transition-colors" title="Edit">
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
  <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onclick={(e) => { if(e.target === e.currentTarget) showModal = false; }}>
    <div class="glass-strong bg-[var(--color-card)] w-full max-w-lg rounded-2xl border border-[var(--color-border)] p-6 shadow-2xl animate-slide-up" onclick={(e) => e.stopPropagation()}>
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-display font-bold">Add Menu Item</h2>
        <button class="p-2 text-[var(--color-text-secondary)] hover:text-white" onclick={() => showModal = false}>✕</button>
      </div>
      
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2 space-y-1">
            <label class="text-sm text-[var(--color-text-secondary)]">Name</label>
            <input type="text" class="input-dark w-full" placeholder="Item name" />
          </div>
          <div class="space-y-1">
            <label class="text-sm text-[var(--color-text-secondary)]">Price (₹)</label>
            <input type="number" class="input-dark w-full" placeholder="0.00" />
          </div>
          <div class="space-y-1">
            <label class="text-sm text-[var(--color-text-secondary)]">Category</label>
            <select class="input-dark w-full appearance-none">
              {#each MOCK_CATEGORIES as cat}
                <option value={cat.id}>{cat.name}</option>
              {/each}
            </select>
          </div>
          <div class="col-span-2 space-y-1">
            <label class="text-sm text-[var(--color-text-secondary)]">Description</label>
            <textarea class="input-dark w-full h-24 resize-none" placeholder="Delicious description..."></textarea>
          </div>
        </div>
      </div>
      
      <div class="flex justify-end gap-3 mt-8">
        <button class="btn-ghost" onclick={() => showModal = false}>Cancel</button>
        <button class="btn-brand" onclick={() => { toast.success('Item added'); showModal = false; }}>Save Item</button>
      </div>
    </div>
  </div>
{/if}
