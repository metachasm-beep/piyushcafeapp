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
  let ownerRestaurantId = $state<string | null>(null);
  let isLoading = $state(true);
  
  let showAddModal = $state(false);
  let showQrModal = $state(false);
  let selectedTable = $state<Table | null>(null);
  let qrDataUrl = $state('');
  let isSaving = $state(false);

  onMount(async () => {
    if (!supabase) { 
      tables = MOCK_TABLES; 
      ownerRestaurantId = MOCK_RESTAURANT.id;
      isLoading = false; 
      return; 
    }
    
    // First, find out which restaurant this owner belongs to
    const { data: staffData } = await supabase.from('restaurant_staff').select('restaurant_id').limit(1).single();
    if (staffData) {
      ownerRestaurantId = staffData.restaurant_id;
    }

    // Fetch all tables for this owner's restaurant (RLS guarantees they only see theirs)
    const { data } = await supabase.from('tables').select('*').order('table_number');
    tables = data ?? MOCK_TABLES;
    isLoading = false;
  });

  async function generateQr(table: Table) {
    selectedTable = table;
    const appUrl = env.PUBLIC_APP_URL || window.location.origin;
    // Uses the owner's actual restaurant ID (or mock fallback if undefined)
    const restId = ownerRestaurantId || MOCK_RESTAURANT.id;
    const url = `${appUrl}/table/${restId}/${table.id}`;
    
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
    if (!ownerRestaurantId && supabase) {
      toast.error('Could not determine your restaurant ID');
      return;
    }

    isSaving = true;
    const fd = new FormData(e.target as HTMLFormElement);
    const newTable: Partial<Table> = {
      id: crypto.randomUUID(),
      table_number: Number(fd.get('table_number')),
      display_name: fd.get('display_name') as string,
      capacity: Number(fd.get('capacity')),
      restaurant_id: ownerRestaurantId || MOCK_RESTAURANT.id,
      is_active: true,
    };
    
    // Optimistic update
    tables = [...tables, newTable as Table];
    toast.success('Table added!');
    showAddModal = false;
    isSaving = false;
    
    if (supabase) {
      const { error } = await supabase.from('tables').insert(newTable);
      if (error) {
        toast.error('Failed to save table');
        // Revert optimistic
        tables = tables.filter(t => t.id !== newTable.id);
      }
    }
  }
</script>

<svelte:head><title>Tables & QR · Owner Portal</title></svelte:head>

<div style="font-family:'Cabinet Grotesk',system-ui,sans-serif;color:var(--color-text-primary);">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;">
    <div>
      <h1 style="font-size:24px;font-weight:800;letter-spacing:-0.02em;margin:0;">Tables & QR Codes</h1>
      <p style="color:var(--color-text-secondary);font-size:14px;margin-top:4px;">{tables.length} tables configured — click to generate QR</p>
    </div>
    <button class="btn-primary" onclick={() => showAddModal = true}>
      <span style="display:flex;align-items:center;gap:6px;"><Plus size={15} strokeWidth={2.5} /> Add Table</span>
    </button>
  </div>

  {#if isLoading}
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;">
      {#each Array(6) as _}
        <div class="glass-panel" style="height:180px;animation:pulse 1.5s infinite;background:var(--color-card);"></div>
      {/each}
    </div>
  {:else if tables.length === 0}
    <div class="glass-panel" style="padding:64px;text-align:center;">
      <div style="font-size:36px;margin-bottom:12px;">🪑</div>
      <div style="font-size:16px;font-weight:700;color:var(--color-text-secondary);">No tables configured</div>
      <button class="btn-primary" style="margin-top:16px;" onclick={() => showAddModal = true}>Add First Table</button>
    </div>
  {:else}
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;">
      {#each tables as table (table.id)}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="glass-panel" style="padding:24px;text-align:center;cursor:pointer;transition:transform 0.2s;" onclick={() => generateQr(table)} onmouseenter={(e) => e.currentTarget.style.transform='scale(1.02)'} onmouseleave={(e) => e.currentTarget.style.transform='scale(1)'}>
          <!-- Big number -->
          <div style="font-size:52px;font-weight:900;color:var(--color-brand);line-height:1;letter-spacing:-0.05em;margin-bottom:8px;font-variant-numeric:tabular-nums;">{table.table_number}</div>
          <div style="font-size:14px;font-weight:700;color:var(--color-text-primary);margin-bottom:4px;">{table.display_name || 'Table ' + table.table_number}</div>
          <div style="display:flex;align-items:center;justify-content:center;gap:4px;font-size:12px;color:var(--color-text-secondary);margin-bottom:16px;">
            <Users size={11} />
            {table.capacity ?? 4} seats
          </div>
          <div style="padding-top:16px;border-top:1px solid var(--color-border);">
            {#if table.is_active}
              <span style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:100px;background:rgba(34,197,94,0.1);color:#22c55e;font-size:11px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;">
                <span style="width:5px;height:5px;border-radius:50%;background:#22c55e;display:inline-block;"></span>
                Active
              </span>
            {:else}
              <span style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:100px;background:rgba(239,68,68,0.1);color:#ef4444;font-size:11px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;">Inactive</span>
            {/if}
          </div>
          <div style="margin-top:12px;display:flex;align-items:center;justify-content:center;gap:5px;font-size:11px;font-family:'Geist Mono',monospace;color:var(--color-brand);">
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
  <div style="position:fixed;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(10px);z-index:100;display:flex;align-items:center;justify-content:center;padding:24px;" onclick={(e) => { if (e.target === e.currentTarget) showQrModal = false; }}>
    <div class="glass-panel" style="width:100%;max-width:360px;padding:36px;text-align:center;position:relative;background:var(--color-surface);" onclick={(e) => e.stopPropagation()}>
      <button style="position:absolute;top:14px;right:14px;width:28px;height:28px;border-radius:8px;background:var(--color-border);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--color-text-secondary);" onclick={() => showQrModal = false}><X size={14} /></button>
      <div style="font-size:13px;font-family:'Geist Mono',monospace;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Table {selectedTable.table_number}</div>
      <div style="font-size:20px;font-weight:900;color:var(--color-text-primary);letter-spacing:-0.03em;margin-bottom:20px;">{selectedTable.display_name || 'Table ' + selectedTable.table_number}</div>
      {#if qrDataUrl}
        <div style="padding:16px;border-radius:16px;background:white;display:inline-block;box-shadow:0 4px 20px rgba(0,0,0,0.2);margin-bottom:20px;">
          <img src={qrDataUrl} alt="QR Code" style="width:200px;height:200px;display:block;" />
        </div>
      {/if}
      <div style="display:flex;gap:10px;">
        <button onclick={downloadQr} class="btn-primary" style="flex:1;">
          <span style="display:flex;align-items:center;justify-content:center;gap:6px;"><Download size={14} /> Download</span>
        </button>
        <button onclick={() => window.print()} style="flex:1;padding:10px;border-radius:12px;background:transparent;border:1px solid var(--color-border);color:var(--color-brand);font-size:14px;font-weight:600;cursor:pointer;font-family:'Cabinet Grotesk',system-ui,sans-serif;">Print</button>
      </div>
    </div>
  </div>
{/if}

<!-- Add Table Modal -->
{#if showAddModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div style="position:fixed;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(10px);z-index:100;display:flex;align-items:center;justify-content:center;padding:24px;" onclick={(e) => { if (e.target === e.currentTarget) showAddModal = false; }}>
    <div class="glass-panel" style="width:100%;max-width:420px;padding:36px;position:relative;background:var(--color-surface);" onclick={(e) => e.stopPropagation()}>
      <button style="position:absolute;top:14px;right:14px;width:28px;height:28px;border-radius:8px;background:var(--color-border);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--color-text-secondary);" onclick={() => showAddModal = false}><X size={14} /></button>
      <h2 style="font-size:20px;font-weight:900;color:var(--color-text-primary);letter-spacing:-0.03em;margin-bottom:24px;">Add New Table</h2>
      <form onsubmit={addTable} style="display:flex;flex-direction:column;gap:16px;">
        <div>
          <label style="display:block;font-size:13px;font-weight:600;color:var(--color-text-secondary);margin-bottom:6px;font-family:'Cabinet Grotesk',system-ui,sans-serif;" for="table_number">Table Number</label>
          <input style="width:100%;padding:12px;border-radius:12px;border:1px solid var(--color-border);background:var(--color-bg);color:var(--color-text-primary);font-size:14px;font-family:'Cabinet Grotesk',system-ui,sans-serif;outline:none;" id="table_number" name="table_number" type="number" required min="1" placeholder="7" />
        </div>
        <div>
          <label style="display:block;font-size:13px;font-weight:600;color:var(--color-text-secondary);margin-bottom:6px;font-family:'Cabinet Grotesk',system-ui,sans-serif;" for="display_name">Display Name</label>
          <input style="width:100%;padding:12px;border-radius:12px;border:1px solid var(--color-border);background:var(--color-bg);color:var(--color-text-primary);font-size:14px;font-family:'Cabinet Grotesk',system-ui,sans-serif;outline:none;" id="display_name" name="display_name" required placeholder="Window Seat" />
        </div>
        <div>
          <label style="display:block;font-size:13px;font-weight:600;color:var(--color-text-secondary);margin-bottom:6px;font-family:'Cabinet Grotesk',system-ui,sans-serif;" for="capacity">Capacity</label>
          <input style="width:100%;padding:12px;border-radius:12px;border:1px solid var(--color-border);background:var(--color-bg);color:var(--color-text-primary);font-size:14px;font-family:'Cabinet Grotesk',system-ui,sans-serif;outline:none;" id="capacity" name="capacity" type="number" min="1" max="50" value="4" />
        </div>
        <div style="display:flex;gap:10px;margin-top:8px;">
          <button type="button" onclick={() => showAddModal = false} style="flex:1;padding:10px;border-radius:12px;background:transparent;border:1px solid var(--color-border);color:var(--color-text-secondary);font-size:14px;font-weight:600;cursor:pointer;font-family:'Cabinet Grotesk',system-ui,sans-serif;">Cancel</button>
          <button type="submit" disabled={isSaving} class="btn-primary" style="flex:2;">{isSaving ? 'Adding...' : 'Add Table'}</button>
        </div>
      </form>
    </div>
  </div>
{/if}
