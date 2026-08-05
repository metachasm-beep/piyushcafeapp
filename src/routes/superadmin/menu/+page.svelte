<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto, invalidateAll } from '$app/navigation';
  import { page } from '$app/state';
  import { formatCurrency, DIETARY_META } from '$lib/utils';
  import { toast } from 'svelte-sonner';
  import { Plus, Search, Edit2, Trash2 } from 'lucide-svelte';
  import type { MenuItem, DietaryTag } from '$lib/types';
  import type { PageData, ActionData } from './$types';
  import SaModal from '$lib/components/sa/SaModal.svelte';
  import SaEmpty from '$lib/components/sa/SaEmpty.svelte';
  import SaErrorBanner from '$lib/components/sa/SaErrorBanner.svelte';
  import { saRestaurantId, saDensity, setSaRestaurantId } from '$lib/stores/saContext';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let selectedCategory = $state<string | null>(null);
  let searchQuery = $state('');
  let showModal = $state(false);
  let showDeleteConfirm = $state(false);
  let editingItem = $state<MenuItem | null>(null);
  let deletingId = $state<string | null>(null);
  let isSaving = $state(false);
  let density = $state<'card' | 'compact'>('card');

  const dietaryOptions = Object.keys(DIETARY_META) as DietaryTag[];

  $effect(() => {
    const u = saDensity.subscribe((v) => (density = v));
    return () => u();
  });

  // Sync shell context → URL/data
  $effect(() => {
    const unsub = saRestaurantId.subscribe((id) => {
      if (!id || id === data.restaurantId) return;
      const url = new URL(page.url);
      url.searchParams.set('restaurant', id);
      goto(`${url.pathname}?${url.searchParams.toString()}`, { invalidateAll: true, keepFocus: true });
    });
    return () => unsub();
  });

  $effect(() => {
    if (data.restaurantId) setSaRestaurantId(data.restaurantId);
  });

  $effect(() => {
    if (form?.error) {
      toast.error(form.error);
      isSaving = false;
    }
    if (form?.success) {
      toast.success(
        form.action === 'delete' ? 'Item deleted' : form.action === 'toggle' ? 'Availability updated' : form.action === 'update' ? 'Item updated' : 'Item added'
      );
      isSaving = false;
      showModal = false;
      showDeleteConfirm = false;
      deletingId = null;
      editingItem = null;
    }
  });

  let filteredItems = $derived(
    data.menuItems.filter((item) => {
      const matchesCat = selectedCategory ? item.category_id === selectedCategory : true;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        item.name.toLowerCase().includes(q) || (item.description ?? '').toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    })
  );

  function openAdd() {
    editingItem = null;
    showModal = true;
  }

  function openEdit(item: MenuItem) {
    editingItem = { ...item };
    showModal = true;
  }

  function askDelete(id: string) {
    deletingId = id;
    showDeleteConfirm = true;
  }

  function getCategoryName(id: string | null) {
    return data.categories.find((c) => c.id === id)?.name ?? 'Uncategorized';
  }

  function restaurantName(id: string) {
    return data.restaurants.find((r) => r.id === id)?.name ?? id;
  }
</script>

<svelte:head><title>Menu · Superadmin</title></svelte:head>

<div>
  <div class="sa-page-header">
    <div>
      <h1 class="sa-page-title">Menu</h1>
      <p class="sa-page-subtitle">
        {restaurantName(data.restaurantId)} · {data.menuItems.length} items · {data.categories.length} categories
      </p>
    </div>
    <button type="button" class="sa-btn-primary" onclick={openAdd} disabled={!data.categories.length}>
      <Plus size={15} strokeWidth={2.5} /> Add item
    </button>
  </div>

  {#if data.loadError}
    <SaErrorBanner title="Menu load warning" message="{data.loadError} — showing fallback data." />
  {/if}

  <div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap;align-items:center;">
    <div style="position:relative;flex:1;min-width:200px;">
      <Search size={14} style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--sa-muted);pointer-events:none;" />
      <input class="sa-input" style="padding-left:36px;" placeholder="Search items…" bind:value={searchQuery} />
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <button type="button" class="sa-chip" class:is-active={selectedCategory === null} onclick={() => (selectedCategory = null)}>All</button>
      {#each data.categories as cat}
        <button type="button" class="sa-chip" class:is-active={selectedCategory === cat.id} onclick={() => (selectedCategory = cat.id)}>
          {cat.icon_emoji ?? ''} {cat.name}
        </button>
      {/each}
    </div>
  </div>

  {#if !data.categories.length}
    <SaEmpty title="No categories for this restaurant" body="Add categories in the database before creating menu items." />
  {:else if filteredItems.length === 0}
    <SaEmpty title="No items match" body={searchQuery || selectedCategory ? 'Try clearing filters.' : 'Add the first menu item for this restaurant.'}>
      {#if !searchQuery && !selectedCategory}
        <button type="button" class="sa-btn-primary" onclick={openAdd}>Add item</button>
      {/if}
    </SaEmpty>
  {:else if density === 'compact'}
    <div class="sa-tile sa-tile-static" style="padding:8px 20px;">
      {#each filteredItems as item (item.id)}
        <div class="sa-list-row">
          <div style="flex:1;min-width:0;">
            <div style="font-size:14px;font-weight:800;">{item.name}</div>
            <div style="font-size:11px;font-family:var(--sa-mono);color:var(--sa-muted);">{getCategoryName(item.category_id)}</div>
          </div>
          <div class="sa-num" style="font-weight:800;color:var(--sa-accent);min-width:72px;text-align:right;">{formatCurrency(item.price)}</div>
          <form method="POST" action="?/toggle" use:enhance>
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="is_available" value={String(!item.is_available)} />
            <button type="submit" class="sa-btn-secondary" style="min-height:40px;font-size:12px;padding:8px 10px;color:{item.is_available ? 'var(--sa-ok)' : 'var(--sa-err)'};border-color:{item.is_available ? 'var(--sa-ok-line)' : 'var(--sa-err-line)'};">
              {item.is_available ? 'On' : 'Off'}
            </button>
          </form>
          <button type="button" class="sa-btn-icon" aria-label="Edit" onclick={() => openEdit(item)}><Edit2 size={14} /></button>
          <button type="button" class="sa-btn-icon sa-btn-danger" aria-label="Delete" onclick={() => askDelete(item.id)}><Trash2 size={14} /></button>
        </div>
      {/each}
    </div>
  {:else}
    <div class="sa-grid-cards" style="grid-template-columns:repeat(auto-fill,minmax(240px,1fr));">
      {#each filteredItems as item (item.id)}
        <div class="sa-tile" style="padding:0;overflow:hidden;">
          <div style="height:120px;background:linear-gradient(135deg,var(--sa-accent-soft),rgba(2,132,199,0.06));position:relative;overflow:hidden;border-radius:var(--sa-radius-xl) var(--sa-radius-xl) 0 0;">
            {#if item.image_url}
              <img src={item.image_url} alt="" style="width:100%;height:100%;object-fit:cover;border-radius:calc(var(--sa-radius-xl) - 1px) calc(var(--sa-radius-xl) - 1px) 0 0;" loading="lazy" />
            {:else}
              <div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--sa-faint);font-size:13px;font-family:var(--sa-mono);">No image</div>
            {/if}
            {#if !item.is_available}
              <div style="position:absolute;inset:0;background:rgba(15,23,42,0.45);display:flex;align-items:center;justify-content:center;">
                <span class="sa-badge-err">Out of stock</span>
              </div>
            {/if}
          </div>
          <div style="padding:14px;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:4px;">
              <div style="font-size:14px;font-weight:800;letter-spacing:-0.02em;line-height:1.25;">{item.name}</div>
              <div class="sa-num" style="font-size:14px;font-weight:800;color:var(--sa-accent);flex-shrink:0;">{formatCurrency(item.price)}</div>
            </div>
            <div style="font-size:11px;font-family:var(--sa-mono);color:var(--sa-muted);margin-bottom:10px;">{getCategoryName(item.category_id)}</div>
            {#if item.dietary_tags?.length}
              <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px;">
                {#each item.dietary_tags as tag}
                  <span style="font-size:10px;padding:2px 7px;border-radius:99px;background:{DIETARY_META[tag]?.bg ?? '#f1f5f9'};color:{DIETARY_META[tag]?.color ?? '#64748b'};font-weight:600;">{DIETARY_META[tag]?.label ?? tag}</span>
                {/each}
              </div>
            {/if}
            <div style="display:flex;gap:8px;align-items:center;">
              <form method="POST" action="?/toggle" use:enhance style="flex:1;">
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="is_available" value={String(!item.is_available)} />
                <button type="submit" class="sa-btn-secondary" style="width:100%;min-height:40px;font-size:12px;color:{item.is_available ? 'var(--sa-ok)' : 'var(--sa-err)'};border-color:{item.is_available ? 'var(--sa-ok-line)' : 'var(--sa-err-line)'};">
                  {item.is_available ? 'Available' : 'Unavailable'}
                </button>
              </form>
              <button type="button" class="sa-btn-icon" aria-label="Edit {item.name}" onclick={() => openEdit(item)}><Edit2 size={14} /></button>
              <button type="button" class="sa-btn-icon sa-btn-danger" aria-label="Delete {item.name}" onclick={() => askDelete(item.id)}><Trash2 size={14} /></button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Add / Edit -->
<SaModal
  open={showModal}
  title={editingItem ? 'Edit item' : 'Add menu item'}
  description={restaurantName(data.restaurantId)}
  maxWidth="520px"
  busy={isSaving}
  onClose={() => { if (!isSaving) showModal = false; }}
>
  <form
    method="POST"
    action={editingItem ? '?/update' : '?/create'}
    use:enhance={() => {
      isSaving = true;
      return async ({ update, result }) => {
        await update({ reset: false });
        isSaving = false;
        if (result.type === 'success') await invalidateAll();
      };
    }}
    style="display:flex;flex-direction:column;gap:14px;"
  >
    {#if editingItem}
      <input type="hidden" name="id" value={editingItem.id} />
    {/if}
    <input type="hidden" name="restaurant_id" value={data.restaurantId} />

    <div>
      <label class="sa-label" for="name">Name</label>
      <input class="sa-input" id="name" name="name" required value={editingItem?.name ?? ''} placeholder="Butter Chicken" />
    </div>
    <div>
      <label class="sa-label" for="description">Description</label>
      <textarea class="sa-input" id="description" name="description" rows="3" placeholder="Short description…">{editingItem?.description ?? ''}</textarea>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div>
        <label class="sa-label" for="price">Price (₹)</label>
        <input class="sa-input sa-num" id="price" name="price" type="number" step="0.01" min="0" required value={editingItem?.price ?? ''} placeholder="350" />
      </div>
      <div>
        <label class="sa-label" for="category_id">Category</label>
        <select class="sa-input" id="category_id" name="category_id" required>
          <option value="" disabled selected={!editingItem?.category_id}>Select…</option>
          {#each data.categories as cat}
            <option value={cat.id} selected={editingItem?.category_id === cat.id}>{cat.name}</option>
          {/each}
        </select>
      </div>
    </div>
    <div>
      <label class="sa-label" for="image_url">Image URL</label>
      <input class="sa-input" id="image_url" name="image_url" type="url" value={editingItem?.image_url ?? ''} placeholder="https://…" />
    </div>
    <div>
      <span class="sa-label">Dietary tags</span>
      <div style="display:flex;flex-wrap:wrap;gap:8px;">
        {#each dietaryOptions as tag}
          <label style="display:inline-flex;align-items:center;gap:6px;padding:8px 12px;min-height:40px;border-radius:99px;border:1px solid var(--sa-line-strong);font-size:12px;font-weight:600;cursor:pointer;background:rgba(255,255,255,0.5);">
            <input type="checkbox" name="dietary_tags" value={tag} checked={editingItem?.dietary_tags?.includes(tag)} />
            {DIETARY_META[tag].label}
          </label>
        {/each}
      </div>
    </div>
    <div>
      <label class="sa-label" for="is_available">Availability</label>
      <select class="sa-input" id="is_available" name="is_available">
        <option value="true" selected={editingItem?.is_available !== false}>Available</option>
        <option value="false" selected={editingItem?.is_available === false}>Out of stock</option>
      </select>
    </div>
    <div style="display:flex;gap:10px;margin-top:4px;">
      <button type="button" class="sa-btn-secondary" style="flex:1;" disabled={isSaving} onclick={() => (showModal = false)}>Cancel</button>
      <button type="submit" disabled={isSaving} class="sa-btn-primary" style="flex:2;">{isSaving ? 'Saving…' : editingItem ? 'Update' : 'Add item'}</button>
    </div>
  </form>
</SaModal>

<!-- Delete confirm -->
<SaModal
  open={showDeleteConfirm}
  title="Delete menu item?"
  description="This cannot be undone"
  busy={isSaving}
  maxWidth="400px"
  onClose={() => { if (!isSaving) { showDeleteConfirm = false; deletingId = null; } }}
>
  <form
    method="POST"
    action="?/delete"
    use:enhance={() => {
      isSaving = true;
      return async ({ update, result }) => {
        await update();
        isSaving = false;
        if (result.type === 'success') await invalidateAll();
      };
    }}
    style="display:flex;flex-direction:column;gap:16px;"
  >
    <input type="hidden" name="id" value={deletingId ?? ''} />
    <p style="font-size:14px;color:var(--sa-muted);margin:0;">Remove this item from the live menu for guests.</p>
    <div style="display:flex;gap:10px;">
      <button type="button" class="sa-btn-secondary" style="flex:1;" disabled={isSaving} onclick={() => { showDeleteConfirm = false; deletingId = null; }}>Cancel</button>
      <button type="submit" class="sa-btn-primary" style="flex:1;background:linear-gradient(135deg,#dc2626,#b91c1c);box-shadow:0 4px 14px rgba(220,38,38,0.28);" disabled={isSaving}>
        {isSaving ? 'Deleting…' : 'Delete'}
      </button>
    </div>
  </form>
</SaModal>
