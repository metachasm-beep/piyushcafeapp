<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { MOCK_MENU_ITEMS, MOCK_CATEGORIES, MOCK_RESTAURANT } from '$lib/mock-data';
  import { formatCurrency, DIETARY_META } from '$lib/utils';
  import { toast } from 'svelte-sonner';
  import { Plus, Search, Edit2, Trash2, X, RefreshCw } from 'lucide-svelte';
  import type { MenuItem, MenuCategory } from '$lib/types';

  let items = $state<MenuItem[]>([]);
  let categories = $state<MenuCategory[]>([]);
  let isLoading = $state(true);
  let selectedCategory = $state<string | null>(null);
  let searchQuery = $state('');
  let showModal = $state(false);
  let editingItem = $state<MenuItem | null>(null);
  let isSaving = $state(false);

  let filteredItems = $derived(
    items.filter(item => {
      const matchesCat = selectedCategory ? item.category_id === selectedCategory : true;
      const q = searchQuery.toLowerCase();
      const matchesSearch = item.name.toLowerCase().includes(q) || (item.description ?? '').toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    })
  );

  onMount(async () => {
    if (!supabase) {
      items = MOCK_MENU_ITEMS;
      categories = MOCK_CATEGORIES;
      isLoading = false;
      return;
    }
    const [catRes, itemRes] = await Promise.all([
      supabase.from('menu_categories').select('*').order('sort_order'),
      supabase.from('menu_items').select('*').order('sort_order')
    ]);
    categories = catRes.data ?? MOCK_CATEGORIES;
    items = itemRes.data ?? MOCK_MENU_ITEMS;
    isLoading = false;
  });

  function openAdd() { editingItem = null; showModal = true; }
  function openEdit(item: MenuItem) { editingItem = { ...item }; showModal = true; }

  async function toggleAvailability(item: MenuItem) {
    const next = !item.is_available;
    items = items.map(i => i.id === item.id ? { ...i, is_available: next } : i);
    toast.success(next ? 'Item marked available' : 'Item marked unavailable');
    if (supabase) await supabase.from('menu_items').update({ is_available: next }).eq('id', item.id);
  }

  async function deleteItem(id: string) {
    if (!confirm('Delete this item?')) return;
    items = items.filter(i => i.id !== id);
    toast.success('Item deleted');
    if (supabase) await supabase.from('menu_items').delete().eq('id', id);
  }

  async function saveItem(e: SubmitEvent) {
    e.preventDefault();
    isSaving = true;
    const fd = new FormData(e.target as HTMLFormElement);
    const data: Partial<MenuItem> = {
      name: fd.get('name') as string,
      description: fd.get('description') as string,
      price: parseFloat(fd.get('price') as string),
      image_url: fd.get('image_url') as string,
      is_available: fd.get('is_available') === 'true',
    };
    if (editingItem) {
      items = items.map(i => i.id === editingItem!.id ? { ...i, ...data } : i);
      toast.success('Item updated');
      if (supabase) await supabase.from('menu_items').update(data).eq('id', editingItem.id);
    } else {
      const newItem = { ...data, id: crypto.randomUUID(), category_id: selectedCategory, restaurant_id: MOCK_RESTAURANT.id, sort_order: 0 } as MenuItem;
      items = [...items, newItem];
      toast.success('Item added');
      if (supabase) await supabase.from('menu_items').insert(newItem);
    }
    showModal = false;
    isSaving = false;
  }

  function getCategoryName(id: string | null) {
    return categories.find(c => c.id === id)?.name ?? 'Uncategorized';
  }
</script>

<svelte:head><title>Menu Manager · Superadmin</title></svelte:head>

<div style="font-family:'Cabinet Grotesk',system-ui,sans-serif;color:#1e1b4b;">
  <!-- Header -->
  <div class="sa-page-header">
    <div>
      <h1 class="sa-page-title">Menu Manager</h1>
      <p class="sa-page-subtitle">{items.length} items across {categories.length} categories</p>
    </div>
    <button class="sa-btn-primary" onclick={openAdd}>
      <span style="display:flex;align-items:center;gap:6px;"><Plus size={15} strokeWidth={2.5} /> Add Item</span>
    </button>
  </div>

  <!-- Filters -->
  <div style="display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap;">
    <!-- Search -->
    <div style="position:relative;flex:1;min-width:220px;">
      <Search size={14} style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#8b84c0;" />
      <input
        class="sa-input"
        style="padding-left:36px;"
        placeholder="Search menu items..."
        bind:value={searchQuery}
      />
    </div>
    <!-- Category filters -->
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <button
        style="padding:8px 16px;border-radius:99px;border:1px solid {selectedCategory === null ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.12)'};background:{selectedCategory === null ? 'rgba(99,102,241,0.1)' : 'transparent'};color:{selectedCategory === null ? '#6366f1' : '#8b84c0'};font-size:13px;font-weight:600;cursor:pointer;font-family:'Cabinet Grotesk',system-ui,sans-serif;"
        onclick={() => selectedCategory = null}
      >All</button>
      {#each categories as cat}
        <button
          style="padding:8px 16px;border-radius:99px;border:1px solid {selectedCategory === cat.id ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.12)'};background:{selectedCategory === cat.id ? 'rgba(99,102,241,0.1)' : 'transparent'};color:{selectedCategory === cat.id ? '#6366f1' : '#8b84c0'};font-size:13px;font-weight:600;cursor:pointer;font-family:'Cabinet Grotesk',system-ui,sans-serif;"
          onclick={() => selectedCategory = cat.id}
        >{cat.icon_emoji ?? ''} {cat.name}</button>
      {/each}
    </div>
  </div>

  {#if isLoading}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {#each Array(6) as _}
        <div class="sa-tile" style="height:200px;background:rgba(99,102,241,0.04);animation:pulse 1.5s infinite;"></div>
      {/each}
    </div>
  {:else if filteredItems.length === 0}
    <div class="sa-tile" style="padding:64px;text-align:center;">
      <div style="font-size:36px;margin-bottom:12px;">🍽️</div>
      <div style="font-size:16px;font-weight:700;color:#8b84c0;">No items found</div>
      <button class="sa-btn-primary" style="margin-top:16px;" onclick={openAdd}>Add First Item</button>
    </div>
  {:else}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {#each filteredItems as item (item.id)}
        <div class="sa-tile" style="padding:0;overflow:hidden;position:relative;">
          <!-- Image -->
          <div style="height:140px;background:linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.06));position:relative;overflow:hidden;">
            {#if item.image_url}
              <img src={item.image_url} alt={item.name} style="width:100%;height:100%;object-fit:cover;" loading="lazy" />
            {:else}
              <div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:36px;">🍴</div>
            {/if}
            {#if !item.is_available}
              <div style="position:absolute;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;">
                <span style="color:white;font-size:12px;font-weight:700;background:rgba(239,68,68,0.8);padding:4px 12px;border-radius:99px;">Out of Stock</span>
              </div>
            {/if}
          </div>
          <!-- Body -->
          <div style="padding:16px;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">
              <div style="font-size:15px;font-weight:800;color:#1e1b4b;letter-spacing:-0.02em;line-height:1.2;max-width:160px;">{item.name}</div>
              <div style="font-size:15px;font-weight:800;color:#6366f1;">{formatCurrency(item.price)}</div>
            </div>
            <div style="font-size:11px;font-family:'Geist Mono',monospace;color:#8b84c0;margin-bottom:12px;">{getCategoryName(item.category_id ?? null)}</div>
            <div style="display:flex;gap:8px;align-items:center;">
              <button
                style="flex:1;padding:7px;border-radius:9px;background:{item.is_available ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)'};border:1px solid {item.is_available ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'};color:{item.is_available ? '#16a34a' : '#dc2626'};font-size:12px;font-weight:600;cursor:pointer;font-family:'Cabinet Grotesk',system-ui,sans-serif;"
                onclick={() => toggleAvailability(item)}
              >{item.is_available ? 'Available' : 'Unavailable'}</button>
              <button
                style="width:32px;height:32px;border-radius:9px;background:rgba(99,102,241,0.06);border:1px solid rgba(99,102,241,0.12);color:#6366f1;display:flex;align-items:center;justify-content:center;cursor:pointer;"
                onclick={() => openEdit(item)}
              ><Edit2 size={13} /></button>
              <button
                style="width:32px;height:32px;border-radius:9px;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.12);color:#ef4444;display:flex;align-items:center;justify-content:center;cursor:pointer;"
                onclick={() => deleteItem(item.id)}
              ><Trash2 size={13} /></button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Add/Edit Modal -->
{#if showModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    style="position:fixed;inset:0;background:rgba(30,27,75,0.3);backdrop-filter:blur(10px);z-index:100;display:flex;align-items:center;justify-content:center;padding:24px;"
    onclick={(e) => { if (e.target === e.currentTarget) showModal = false; }}
  >
    <div class="sa-tile" style="width:100%;max-width:500px;padding:36px;max-height:90vh;overflow-y:auto;position:relative;" onclick={(e) => e.stopPropagation()}>
      <button style="position:absolute;top:16px;right:16px;width:28px;height:28px;border-radius:8px;background:rgba(99,102,241,0.07);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#8b84c0;" onclick={() => showModal = false}><X size={14} /></button>
      <h2 style="font-size:20px;font-weight:900;color:#1e1b4b;letter-spacing:-0.03em;margin-bottom:24px;">{editingItem ? 'Edit Item' : 'Add Menu Item'}</h2>
      <form onsubmit={saveItem} style="display:flex;flex-direction:column;gap:16px;">
        <div>
          <label class="sa-label" for="name">Item Name</label>
          <input class="sa-input" id="name" name="name" required value={editingItem?.name ?? ''} placeholder="Butter Chicken" />
        </div>
        <div>
          <label class="sa-label" for="description">Description</label>
          <input class="sa-input" id="description" name="description" value={editingItem?.description ?? ''} placeholder="Creamy tomato-based curry..." />
        </div>
        <div>
          <label class="sa-label" for="price">Price (₹)</label>
          <input class="sa-input" id="price" name="price" type="number" step="0.01" required value={editingItem?.price ?? ''} placeholder="350" />
        </div>
        <div>
          <label class="sa-label" for="image_url">Image URL</label>
          <input class="sa-input" id="image_url" name="image_url" type="url" value={editingItem?.image_url ?? ''} placeholder="https://..." />
        </div>
        <div>
          <label class="sa-label" for="is_available">Availability</label>
          <select class="sa-input" id="is_available" name="is_available">
            <option value="true" selected={editingItem?.is_available !== false}>Available</option>
            <option value="false" selected={editingItem?.is_available === false}>Out of Stock</option>
          </select>
        </div>
        <div style="display:flex;gap:10px;margin-top:8px;">
          <button type="button" onclick={() => showModal = false} style="flex:1;padding:10px;border-radius:12px;background:transparent;border:1px solid rgba(99,102,241,0.15);color:#8b84c0;font-size:14px;font-weight:600;cursor:pointer;font-family:'Cabinet Grotesk',system-ui,sans-serif;">Cancel</button>
          <button type="submit" disabled={isSaving} class="sa-btn-primary" style="flex:2;">{isSaving ? 'Saving...' : editingItem ? 'Update Item' : 'Add Item'}</button>
        </div>
      </form>
    </div>
  </div>
{/if}
