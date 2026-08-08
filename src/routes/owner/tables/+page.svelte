<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { toast } from 'svelte-sonner';
  import QRCode from 'qrcode';
  import { env } from '$env/dynamic/public';
  import { Plus, QrCode as QrIcon, Download, X, Users } from 'lucide-svelte';
  import type { Table } from '$lib/types';

  let { data } = $props();
  let restaurant = $derived(data.restaurant);

  let tables = $state<Table[]>([]);
  let isLoading = $state(true);
  
  let showAddModal = $state(false);
  let showQrModal = $state(false);
  let selectedTable = $state<Table | null>(null);
  let qrDataUrl = $state('');
  let isSaving = $state(false);

  onMount(async () => {
    if (!supabase || !restaurant) { 
      isLoading = false; 
      return; 
    }
    
    // Fetch all tables for this owner's restaurant
    const { data: tableData } = await supabase.from('tables').select('*').eq('restaurant_id', restaurant.id).order('table_number');
    tables = tableData ?? [];
    isLoading = false;
  });

  async function generateQr(table: Table) {
    selectedTable = table;
    const appUrl = env.PUBLIC_APP_URL || window.location.origin;
    const url = `${appUrl}/table/${restaurant?.id}/${table.id}`;
    
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
    if (!restaurant?.id && supabase) {
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
      restaurant_id: restaurant?.id,
      is_active: true,
    };
    
    // Optimistic update
    tables = [...tables, newTable as Table];
    toast.success('Table added!');
    showAddModal = false;
    isSaving = false;
    
    if (supabase) {
      const dbPayload = {
        id: newTable.id,
        restaurant_id: newTable.restaurant_id,
        table_number: newTable.table_number?.toString(), // DB expects text
        display_name: newTable.display_name,
        is_active: newTable.is_active
      };
      
      const { error } = await supabase.from('tables').insert(dbPayload);
      if (error) {
        console.error('Supabase Error:', error);
        toast.error('Failed to save table');
        // Revert optimistic
        tables = tables.filter(t => t.id !== newTable.id);
      }
    }
  }
</script>

<svelte:head><title>Tables & QR · Owner Portal</title></svelte:head>

<div class="max-w-6xl mx-auto space-y-6 animate-fade-in pb-10">
  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-zinc-950">Tables & QR Codes</h1>
      <p class="text-sm text-zinc-500 mt-1">{tables.length} tables configured — click to generate QR</p>
    </div>
    <button class="px-4 py-2 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800 transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap" onclick={() => showAddModal = true}>
      <Plus size={18} strokeWidth={2.5} /> Add Table
    </button>
  </div>

  {#if isLoading}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {#each Array(6) as _}
        <div class="h-44 bg-zinc-100 rounded-2xl animate-pulse"></div>
      {/each}
    </div>
  {:else if tables.length === 0}
    <div class="bg-white border border-zinc-200 rounded-2xl p-16 text-center shadow-sm">
      <div class="text-4xl mb-3">🪑</div>
      <div class="text-base font-bold text-zinc-500">No tables configured</div>
      <button class="mt-4 px-4 py-2 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800 transition-colors shadow-sm" onclick={() => showAddModal = true}>Add First Table</button>
    </div>
  {:else}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {#each tables as table (table.id)}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="bg-white border border-zinc-200 rounded-2xl p-6 text-center cursor-pointer transition-transform hover:scale-[1.02] shadow-sm flex flex-col items-center" onclick={() => generateQr(table)}>
          <!-- Big number -->
          <div class="text-5xl font-black text-zinc-950 leading-none tracking-tight mb-2 font-mono">{table.table_number}</div>
          <div class="text-sm font-bold text-zinc-800 mb-1">{table.display_name || 'Table ' + table.table_number}</div>
          <div class="flex items-center justify-center gap-1.5 text-xs text-zinc-500 font-medium mb-4">
            <Users size={12} />
            {table.capacity ?? 4} seats
          </div>
          <div class="pt-4 border-t border-zinc-100 w-full mb-3">
            {#if table.is_active}
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold tracking-widest uppercase">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                Active
              </span>
            {:else}
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-[10px] font-bold tracking-widest uppercase">
                Inactive
              </span>
            {/if}
          </div>
          <div class="mt-auto flex items-center justify-center gap-1.5 text-xs font-mono font-bold text-zinc-900 bg-zinc-100 px-3 py-1.5 rounded-lg w-full">
            <QrIcon size={14} /> Tap for QR
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
  <div class="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-6" onclick={(e) => { if (e.target === e.currentTarget) showQrModal = false; }}>
    <div class="bg-white border border-zinc-200 w-full max-w-sm p-8 rounded-2xl text-center relative shadow-xl" onclick={(e) => e.stopPropagation()}>
      <button class="absolute top-4 right-4 w-8 h-8 rounded-lg bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center text-zinc-500 transition-colors" onclick={() => showQrModal = false}><X size={16} /></button>
      <div class="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-1 font-semibold">Table {selectedTable.table_number}</div>
      <div class="text-xl font-black text-zinc-950 tracking-tight mb-6">{selectedTable.display_name || 'Table ' + selectedTable.table_number}</div>
      {#if qrDataUrl}
        <div class="p-4 rounded-xl bg-white border border-zinc-200 shadow-sm inline-block mb-6">
          <img src={qrDataUrl} alt="QR Code" class="w-48 h-48 block" />
        </div>
      {/if}
      <div class="flex gap-3">
        <button onclick={downloadQr} class="flex-1 py-2.5 px-4 rounded-lg font-medium bg-zinc-900 text-white hover:bg-zinc-800 transition-colors shadow-sm flex justify-center items-center gap-2 text-sm">
          <Download size={16} /> Download
        </button>
        <button onclick={() => window.print()} class="flex-1 py-2.5 px-4 rounded-lg font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 transition-colors text-sm">Print</button>
      </div>
    </div>
  </div>
{/if}

<!-- Add Table Modal -->
{#if showAddModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-6" onclick={(e) => { if (e.target === e.currentTarget) showAddModal = false; }}>
    <div class="bg-white border border-zinc-200 w-full max-w-md p-8 rounded-2xl relative shadow-xl" onclick={(e) => e.stopPropagation()}>
      <button class="absolute top-4 right-4 w-8 h-8 rounded-lg bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center text-zinc-500 transition-colors" onclick={() => showAddModal = false}><X size={16} /></button>
      <h2 class="text-xl font-bold text-zinc-950 tracking-tight mb-6">Add New Table</h2>
      <form onsubmit={addTable} class="flex flex-col gap-4">
        <div>
          <label class="block text-sm font-medium text-zinc-700 mb-1.5" for="table_number">Table Number</label>
          <input class="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all" id="table_number" name="table_number" type="number" required min="1" placeholder="7" />
        </div>
        <div>
          <label class="block text-sm font-medium text-zinc-700 mb-1.5" for="display_name">Display Name</label>
          <input class="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all" id="display_name" name="display_name" required placeholder="Window Seat" />
        </div>
        <div>
          <label class="block text-sm font-medium text-zinc-700 mb-1.5" for="capacity">Capacity</label>
          <input class="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all" id="capacity" name="capacity" type="number" min="1" max="50" value="4" />
        </div>
        <div class="flex gap-3 mt-2">
          <button type="button" onclick={() => showAddModal = false} class="flex-1 py-2.5 px-4 rounded-lg font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 transition-colors text-sm">Cancel</button>
          <button type="submit" disabled={isSaving} class="flex-[2] py-2.5 px-4 rounded-lg font-medium bg-zinc-900 text-white hover:bg-zinc-800 transition-colors shadow-sm text-sm">{isSaving ? 'Adding...' : 'Add Table'}</button>
        </div>
      </form>
    </div>
  </div>
{/if}
