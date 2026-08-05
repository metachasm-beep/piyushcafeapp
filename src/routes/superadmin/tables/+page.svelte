<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { MOCK_TABLES, MOCK_RESTAURANT } from '$lib/mock-data';
  import { toast } from 'svelte-sonner';
  import QRCode from 'qrcode';
  import { env } from '$env/dynamic/public';
  import { Plus, QrCode as QrIcon, Download, X, Users } from 'lucide-svelte';
  import type { Table } from '$lib/types';

  let tables = $state<Table[]>([]);
  let isLoading = $state(true);
  let showAddModal = $state(false);
  let showQrModal = $state(false);
  let selectedTable = $state<Table | null>(null);
  let qrDataUrl = $state('');
  let isSaving = $state(false);

  onMount(async () => {
    if (!supabase) { tables = MOCK_TABLES; isLoading = false; return; }
    const { data } = await supabase.from('tables').select('*').order('table_number');
    tables = data ?? MOCK_TABLES;
    isLoading = false;
  });

  async function generateQr(table: Table) {
    selectedTable = table;
    const appUrl = env.PUBLIC_APP_URL || 'http://localhost:5173';
    const url = `${appUrl}/table/${MOCK_RESTAURANT.id}/${table.id}`;
    qrDataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2, color: { dark: '#1e1b4b', light: '#ffffff' } });
    showQrModal = true;
  }

  function downloadQr() {
    if (!qrDataUrl || !selectedTable) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `qr-table-${selectedTable.table_number}.png`;
    a.click();
  }

  async function addTable(e: SubmitEvent) {
    e.preventDefault();
    isSaving = true;
    const fd = new FormData(e.target as HTMLFormElement);
    const newTable: Partial<Table> = {
      id: crypto.randomUUID(),
      table_number: fd.get('table_number') as string,
      display_name: fd.get('display_name') as string,
      is_active: true,
      restaurant_id: MOCK_RESTAURANT.id,
    };
    tables = [...tables, newTable as Table];
    toast.success('Table added!');
    showAddModal = false;
    isSaving = false;
    if (supabase) await supabase.from('tables').insert(newTable);
  }
</script>

<svelte:head><title>Tables & QR · Superadmin</title></svelte:head>

<div style="font-family:'Cabinet Grotesk',system-ui,sans-serif;color:#1e1b4b;">
  <div class="sa-page-header">
    <div>
      <h1 class="sa-page-title">Tables & QR Codes</h1>
      <p class="sa-page-subtitle">{tables.length} tables configured — click to generate QR</p>
    </div>
    <button class="sa-btn-primary" onclick={() => showAddModal = true}>
      <span style="display:flex;align-items:center;gap:6px;"><Plus size={15} strokeWidth={2.5} /> Add Table</span>
    </button>
  </div>

  {#if isLoading}
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;">
      {#each Array(6) as _}
        <div class="sa-tile" style="height:180px;animation:pulse 1.5s infinite;background:rgba(99,102,241,0.04);"></div>
      {/each}
    </div>
  {:else if tables.length === 0}
    <div class="sa-tile" style="padding:64px;text-align:center;">
      <div style="font-size:36px;margin-bottom:12px;">🪑</div>
      <div style="font-size:16px;font-weight:700;color:#8b84c0;">No tables configured</div>
      <button class="sa-btn-primary" style="margin-top:16px;" onclick={() => showAddModal = true}>Add First Table</button>
    </div>
  {:else}
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;">
      {#each tables as table (table.id)}
        <div class="sa-tile" style="padding:24px;text-align:center;cursor:pointer;" onclick={() => generateQr(table)}>
          <!-- Big number -->
          <div style="font-size:52px;font-weight:900;color:#6366f1;line-height:1;letter-spacing:-0.05em;margin-bottom:8px;font-variant-numeric:tabular-nums;">{table.table_number}</div>
          <div style="font-size:14px;font-weight:700;color:#1e1b4b;margin-bottom:4px;">{table.display_name || 'Table ' + table.table_number}</div>
          <div style="display:flex;align-items:center;justify-content:center;gap:4px;font-size:12px;color:#8b84c0;margin-bottom:16px;">
            <Users size={11} />
            {table.capacity ?? 4} seats
          </div>
          <div style="padding-top:16px;border-top:1px solid rgba(99,102,241,0.08);">
            {#if table.is_active}
              <span class="sa-badge-active">
                <span style="width:5px;height:5px;border-radius:50%;background:#22c55e;display:inline-block;"></span>
                Active
              </span>
            {:else}
              <span class="sa-badge-inactive">Inactive</span>
            {/if}
          </div>
          <div style="margin-top:12px;display:flex;align-items:center;justify-content:center;gap:5px;font-size:11px;font-family:'Geist Mono',monospace;color:#a5b4fc;">
            <QrIcon size={11} /> Tap to generate QR
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- QR Modal -->
{#if showQrModal && selectedTable}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div style="position:fixed;inset:0;background:rgba(30,27,75,0.35);backdrop-filter:blur(10px);z-index:100;display:flex;align-items:center;justify-content:center;padding:24px;" onclick={(e) => { if (e.target === e.currentTarget) showQrModal = false; }}>
    <div class="sa-tile" style="width:100%;max-width:360px;padding:36px;text-align:center;position:relative;" onclick={(e) => e.stopPropagation()}>
      <button style="position:absolute;top:14px;right:14px;width:28px;height:28px;border-radius:8px;background:rgba(99,102,241,0.07);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#8b84c0;" onclick={() => showQrModal = false}><X size={14} /></button>
      <div style="font-size:13px;font-family:'Geist Mono',monospace;color:#8b84c0;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Table {selectedTable.table_number}</div>
      <div style="font-size:20px;font-weight:900;color:#1e1b4b;letter-spacing:-0.03em;margin-bottom:20px;">{selectedTable.display_name || 'Table ' + selectedTable.table_number}</div>
      {#if qrDataUrl}
        <div style="padding:16px;border-radius:16px;background:white;display:inline-block;box-shadow:0 4px 20px rgba(99,102,241,0.12);margin-bottom:20px;">
          <img src={qrDataUrl} alt="QR Code" style="width:200px;height:200px;display:block;" />
        </div>
      {/if}
      <div style="display:flex;gap:10px;">
        <button onclick={downloadQr} class="sa-btn-primary" style="flex:1;">
          <span style="display:flex;align-items:center;justify-content:center;gap:6px;"><Download size={14} /> Download</span>
        </button>
        <button onclick={() => window.print()} style="flex:1;padding:10px;border-radius:12px;background:transparent;border:1px solid rgba(99,102,241,0.2);color:#6366f1;font-size:14px;font-weight:600;cursor:pointer;font-family:'Cabinet Grotesk',system-ui,sans-serif;">Print</button>
      </div>
    </div>
  </div>
{/if}

<!-- Add Table Modal -->
{#if showAddModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div style="position:fixed;inset:0;background:rgba(30,27,75,0.3);backdrop-filter:blur(10px);z-index:100;display:flex;align-items:center;justify-content:center;padding:24px;" onclick={(e) => { if (e.target === e.currentTarget) showAddModal = false; }}>
    <div class="sa-tile" style="width:100%;max-width:420px;padding:36px;position:relative;" onclick={(e) => e.stopPropagation()}>
      <button style="position:absolute;top:14px;right:14px;width:28px;height:28px;border-radius:8px;background:rgba(99,102,241,0.07);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#8b84c0;" onclick={() => showAddModal = false}><X size={14} /></button>
      <h2 style="font-size:20px;font-weight:900;color:#1e1b4b;letter-spacing:-0.03em;margin-bottom:24px;">Add New Table</h2>
      <form onsubmit={addTable} style="display:flex;flex-direction:column;gap:16px;">
        <div>
          <label class="sa-label" for="table_number">Table Number</label>
          <input class="sa-input" id="table_number" name="table_number" type="number" required min="1" placeholder="7" />
        </div>
        <div>
          <label class="sa-label" for="display_name">Display Name</label>
          <input class="sa-input" id="display_name" name="display_name" required placeholder="Window Seat" />
        </div>
        <div>
          <label class="sa-label" for="capacity">Capacity</label>
          <input class="sa-input" id="capacity" name="capacity" type="number" min="1" max="50" value="4" />
        </div>
        <div style="display:flex;gap:10px;margin-top:8px;">
          <button type="button" onclick={() => showAddModal = false} style="flex:1;padding:10px;border-radius:12px;background:transparent;border:1px solid rgba(99,102,241,0.15);color:#8b84c0;font-size:14px;font-weight:600;cursor:pointer;font-family:'Cabinet Grotesk',system-ui,sans-serif;">Cancel</button>
          <button type="submit" disabled={isSaving} class="sa-btn-primary" style="flex:2;">{isSaving ? 'Adding...' : 'Add Table'}</button>
        </div>
      </form>
    </div>
  </div>
{/if}
