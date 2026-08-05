<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto, invalidateAll } from '$app/navigation';
  import { page } from '$app/state';
  import { toast } from 'svelte-sonner';
  import QRCode from 'qrcode';
  import { env } from '$env/dynamic/public';
  import { Plus, QrCode as QrIcon, Download, Users, Copy, Link2, Pencil } from 'lucide-svelte';
  import type { Table } from '$lib/types';
  import type { PageData, ActionData } from './$types';
  import SaModal from '$lib/components/sa/SaModal.svelte';
  import SaEmpty from '$lib/components/sa/SaEmpty.svelte';
  import SaErrorBanner from '$lib/components/sa/SaErrorBanner.svelte';
  import {
    saRestaurantId,
    saDensity,
    setSaRestaurantId,
    tableDeepLink
  } from '$lib/stores/saContext';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let showAddModal = $state(false);
  let showEditModal = $state(false);
  let showQrModal = $state(false);
  let selectedTable = $state<Table | null>(null);
  let editingTable = $state<Table | null>(null);
  let qrDataUrl = $state('');
  let deepLink = $state('');
  let isSaving = $state(false);
  let density = $state<'card' | 'compact'>('card');

  $effect(() => {
    const u = saDensity.subscribe((v) => (density = v));
    return () => u();
  });

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
        form.action === 'provision'
          ? 'Table added'
          : form.action === 'toggleStatus'
            ? 'Status updated'
            : 'Table updated'
      );
      isSaving = false;
      showAddModal = false;
      showEditModal = false;
      editingTable = null;
    }
  });

  function tableUrl(table: Table) {
    const appUrl = env.PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    return tableDeepLink(data.restaurantId, table.id, appUrl);
  }

  async function openQr(table: Table) {
    selectedTable = table;
    deepLink = tableUrl(table);
    qrDataUrl = await QRCode.toDataURL(deepLink, {
      width: 300,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' }
    });
    showQrModal = true;
  }

  function downloadQr() {
    if (!qrDataUrl || !selectedTable) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `qr-table-${selectedTable.table_number}.png`;
    a.click();
  }

  async function copyLink(table?: Table) {
    const url = table ? tableUrl(table) : deepLink;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Deep link copied');
    } catch {
      toast.error('Could not copy link');
    }
  }

  function openEdit(table: Table, e?: Event) {
    e?.stopPropagation();
    editingTable = { ...table };
    showEditModal = true;
  }

  function onCardKey(e: KeyboardEvent, table: Table) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openQr(table);
    }
  }

  function restaurantName(id: string) {
    return data.restaurants.find((r) => r.id === id)?.name ?? id;
  }
</script>

<svelte:head><title>Tables & QR · Superadmin</title></svelte:head>

<div>
  <div class="sa-page-header">
    <div>
      <h1 class="sa-page-title">Tables & QR</h1>
      <p class="sa-page-subtitle">
        {restaurantName(data.restaurantId)} · {data.tables.length} table{data.tables.length === 1 ? '' : 's'}
      </p>
    </div>
    <button type="button" class="sa-btn-primary" onclick={() => (showAddModal = true)}>
      <Plus size={15} strokeWidth={2.5} /> Add table
    </button>
  </div>

  {#if data.loadError}
    <SaErrorBanner title="Tables load warning" message="{data.loadError} — showing fallback data." />
  {/if}

  {#if data.tables.length === 0}
    <SaEmpty title="No tables yet" body="Provision tables to generate guest QR deep links.">
      <button type="button" class="sa-btn-primary" onclick={() => (showAddModal = true)}>Add table</button>
    </SaEmpty>
  {:else if density === 'compact'}
    <div class="sa-tile sa-tile-static" style="padding:8px 20px;">
      {#each data.tables as table (table.id)}
        <div class="sa-list-row">
          <div class="sa-num" style="font-size:22px;font-weight:900;color:var(--sa-accent);min-width:40px;">{table.table_number}</div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:14px;font-weight:700;">{table.display_name || `Table ${table.table_number}`}</div>
            <div style="font-size:11px;color:var(--sa-muted);display:flex;align-items:center;gap:4px;">
              <Users size={11} /> <span class="sa-num">{table.capacity ?? 4}</span> seats
            </div>
          </div>
          {#if table.is_active}
            <span class="sa-badge-active">Active</span>
          {:else}
            <span class="sa-badge-inactive">Inactive</span>
          {/if}
          <button type="button" class="sa-btn-icon" aria-label="Copy link" onclick={() => copyLink(table)}><Copy size={14} /></button>
          <button type="button" class="sa-btn-icon" aria-label="QR code" onclick={() => openQr(table)}><QrIcon size={14} /></button>
          <button type="button" class="sa-btn-icon" aria-label="Edit" onclick={(e) => openEdit(table, e)}><Pencil size={14} /></button>
          <form method="POST" action="?/toggleStatus" use:enhance>
            <input type="hidden" name="id" value={table.id} />
            <input type="hidden" name="is_active" value={String(!table.is_active)} />
            <button type="submit" class="sa-btn-secondary" style="min-height:40px;font-size:12px;padding:8px 10px;">
              {table.is_active ? 'Disable' : 'Enable'}
            </button>
          </form>
        </div>
      {/each}
    </div>
  {:else}
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:var(--sa-density-gap);">
      {#each data.tables as table (table.id)}
        <div
          class="sa-tile"
          role="button"
          tabindex="0"
          style="padding:var(--sa-density-pad);text-align:center;cursor:pointer;"
          onclick={() => openQr(table)}
          onkeydown={(e) => onCardKey(e, table)}
          aria-label="Table {table.table_number}, open QR"
        >
          <div class="sa-num" style="font-size:48px;font-weight:900;color:var(--sa-accent);line-height:1;letter-spacing:-0.05em;margin-bottom:8px;">{table.table_number}</div>
          <div style="font-size:14px;font-weight:700;color:var(--sa-ink);margin-bottom:4px;">{table.display_name || `Table ${table.table_number}`}</div>
          <div style="display:flex;align-items:center;justify-content:center;gap:4px;font-size:12px;color:var(--sa-muted);margin-bottom:14px;">
            <Users size={11} />
            <span class="sa-num">{table.capacity ?? 4}</span> seats
          </div>
          <div style="padding-top:14px;border-top:1px solid var(--sa-line);margin-bottom:12px;">
            {#if table.is_active}
              <span class="sa-badge-active">Active</span>
            {:else}
              <span class="sa-badge-inactive">Inactive</span>
            {/if}
          </div>
          <div style="display:flex;gap:6px;justify-content:center;" class="sa-no-print">
            <button type="button" class="sa-btn-icon" aria-label="Copy deep link" onclick={(e) => { e.stopPropagation(); copyLink(table); }}>
              <Link2 size={14} />
            </button>
            <button type="button" class="sa-btn-icon" aria-label="Edit table" onclick={(e) => openEdit(table, e)}>
              <Pencil size={14} />
            </button>
            <form method="POST" action="?/toggleStatus" use:enhance>
              <input type="hidden" name="id" value={table.id} />
              <input type="hidden" name="is_active" value={String(!table.is_active)} />
              <button
                type="submit"
                class="sa-btn-secondary"
                style="min-height:var(--sa-hit);font-size:12px;padding:8px 10px;"
                onclick={(e) => e.stopPropagation()}
              >
                {table.is_active ? 'Off' : 'On'}
              </button>
            </form>
          </div>
          <div style="margin-top:10px;display:flex;align-items:center;justify-content:center;gap:5px;font-size:11px;font-family:var(--sa-mono);color:var(--sa-faint);">
            <QrIcon size={11} /> Enter / click for QR
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- QR -->
<SaModal
  open={showQrModal && !!selectedTable}
  title={selectedTable ? `Table ${selectedTable.table_number}` : 'QR'}
  description={selectedTable?.display_name || ''}
  maxWidth="380px"
  onClose={() => (showQrModal = false)}
>
  {#if selectedTable}
    <div class="sa-print-qr">
      <div style="font-size:13px;font-family:var(--sa-mono);color:var(--sa-muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Table {selectedTable.table_number}</div>
      <div style="font-size:18px;font-weight:900;color:var(--sa-ink);letter-spacing:-0.03em;margin-bottom:16px;">{selectedTable.display_name || `Table ${selectedTable.table_number}`}</div>
      {#if qrDataUrl}
        <div style="padding:14px;border-radius:calc(var(--sa-radius-xl) - 8px);background:white;display:inline-block;box-shadow:var(--sa-shadow-md);margin-bottom:16px;">
          <img src={qrDataUrl} alt="QR for table {selectedTable.table_number}" style="width:200px;height:200px;display:block;" />
        </div>
      {/if}
      <p class="sa-num" style="font-size:11px;font-family:var(--sa-mono);color:var(--sa-muted);word-break:break-all;max-width:280px;margin:0 auto 16px;">{deepLink}</p>
    </div>
    <div class="sa-no-print" style="display:flex;flex-direction:column;gap:8px;">
      <div style="display:flex;gap:8px;">
        <button type="button" class="sa-btn-primary" style="flex:1;" onclick={downloadQr}>
          <Download size={14} /> Download
        </button>
        <button type="button" class="sa-btn-secondary" style="flex:1;" onclick={() => window.print()}>Print</button>
      </div>
      <button type="button" class="sa-btn-secondary" style="width:100%;" onclick={() => copyLink()}>
        <Copy size={14} /> Copy deep link
      </button>
    </div>
  {/if}
</SaModal>

<!-- Add -->
<SaModal
  open={showAddModal}
  title="Add table"
  description={restaurantName(data.restaurantId)}
  busy={isSaving}
  onClose={() => { if (!isSaving) showAddModal = false; }}
>
  <form
    method="POST"
    action="?/provision"
    use:enhance={() => {
      isSaving = true;
      return async ({ update, result }) => {
        await update({ reset: true });
        isSaving = false;
        if (result.type === 'success') await invalidateAll();
      };
    }}
    style="display:flex;flex-direction:column;gap:14px;"
  >
    <input type="hidden" name="restaurant_id" value={data.restaurantId} />
    <div>
      <label class="sa-label" for="table_number">Table number</label>
      <input class="sa-input sa-num" id="table_number" name="table_number" type="number" required min="1" placeholder="7" />
    </div>
    <div>
      <label class="sa-label" for="display_name">Display name</label>
      <input class="sa-input" id="display_name" name="display_name" required placeholder="Window Seat" />
    </div>
    <div>
      <label class="sa-label" for="capacity">Capacity</label>
      <input class="sa-input sa-num" id="capacity" name="capacity" type="number" min="1" max="50" value="4" required />
    </div>
    <div style="display:flex;gap:10px;margin-top:4px;">
      <button type="button" class="sa-btn-secondary" style="flex:1;" disabled={isSaving} onclick={() => (showAddModal = false)}>Cancel</button>
      <button type="submit" disabled={isSaving} class="sa-btn-primary" style="flex:2;">{isSaving ? 'Adding…' : 'Add table'}</button>
    </div>
  </form>
</SaModal>

<!-- Edit -->
<SaModal
  open={showEditModal && !!editingTable}
  title="Edit table"
  busy={isSaving}
  onClose={() => { if (!isSaving) { showEditModal = false; editingTable = null; } }}
>
  {#if editingTable}
    <form
      method="POST"
      action="?/update"
      use:enhance={() => {
        isSaving = true;
        return async ({ update, result }) => {
          await update();
          isSaving = false;
          if (result.type === 'success') await invalidateAll();
        };
      }}
      style="display:flex;flex-direction:column;gap:14px;"
    >
      <input type="hidden" name="id" value={editingTable.id} />
      <div>
        <label class="sa-label" for="edit_table_number">Table number</label>
        <input class="sa-input sa-num" id="edit_table_number" name="table_number" type="number" required min="1" value={editingTable.table_number} />
      </div>
      <div>
        <label class="sa-label" for="edit_display_name">Display name</label>
        <input class="sa-input" id="edit_display_name" name="display_name" required value={editingTable.display_name ?? ''} />
      </div>
      <div>
        <label class="sa-label" for="edit_capacity">Capacity</label>
        <input class="sa-input sa-num" id="edit_capacity" name="capacity" type="number" min="1" max="50" required value={editingTable.capacity ?? 4} />
      </div>
      <div style="display:flex;gap:10px;margin-top:4px;">
        <button type="button" class="sa-btn-secondary" style="flex:1;" disabled={isSaving} onclick={() => { showEditModal = false; editingTable = null; }}>Cancel</button>
        <button type="submit" disabled={isSaving} class="sa-btn-primary" style="flex:2;">{isSaving ? 'Saving…' : 'Save'}</button>
      </div>
    </form>
  {/if}
</SaModal>
