<script lang="ts">
  import { Store, Plus, X, Download, QrCode as QrIcon, Users, Grid2X2, Trash2 } from 'lucide-svelte';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import QRCode from 'qrcode';
  import { fade } from 'svelte/transition';
  import { toast } from 'svelte-sonner';
  import Card from '$lib/components/ui/card.svelte';
  import CardHeader from '$lib/components/ui/card-header.svelte';
  import CardContent from '$lib/components/ui/card-content.svelte';
  
  let { data } = $props();
  import { enhance } from '$app/forms';

  let selectedRestaurantId = $state('');
  let filteredTables = $derived(
    selectedRestaurantId 
      ? tables.filter((t: any) => t.restaurant_id === selectedRestaurantId)
      : tables
  );

  let showAddModal = $state(false);
  let showQrModal = $state(false);
  
  let selectedTable = $state<any>(null);
  let qrDataUrl = $state('');
  let isLoading = $state(false);
  let isSaving = $state(false);

  // Sync data props to reactive variables
  let restaurants = $derived(data.restaurants || []);
  let tables = $derived(data.tables || []);

  async function generateQr(table: any) {
    selectedTable = table;
    const url = `${$page.url.origin}/table/${table.restaurant_id}/${table.id}`;
    try {
      qrDataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: { dark: '#09090b', light: '#ffffff' }
      });
      showQrModal = true;
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate QR code');
    }
  }

  function downloadQr() {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `table-${selectedTable?.table_number}-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function handleDeleteTable() {
    return async ({ result, update }: any) => {
      if (result.type === 'success') {
        toast.success(`Table deleted successfully`);
        await update(); // Invalidate and reload tables
      } else if (result.type === 'failure') {
        toast.error(result.data?.error || 'Failed to delete table');
      } else {
        toast.error('An error occurred');
      }
    };
  }

  function handleAddTable() {
    isSaving = true;
    return async ({ result, update }: any) => {
      isSaving = false;
      if (result.type === 'success') {
        showAddModal = false;
        toast.success(`Table added successfully`);
        await update(); // Invalidate and reload tables
        
        if (result.data?.table) {
            generateQr(result.data.table);
        }
      } else if (result.type === 'failure') {
        if (result.data?.errors) {
            const errs = Object.values(result.data.errors).flat().join(', ');
            toast.error(errs || 'Validation failed');
        } else {
            toast.error(result.data?.error || 'Failed to add table');
        }
      } else {
        toast.error('An error occurred');
      }
    };
  }
</script>

<svelte:head>
  <title>Tables | Superadmin</title>
</svelte:head>

<div class="flex-1 space-y-4">
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
    <div class="flex items-center gap-4">
      <div class="w-10 h-10 rounded-md bg-zinc-100 flex items-center justify-center border border-zinc-200 text-zinc-900">
        <Grid2X2 size={20} />
      </div>
      <div>
        <h2 class="text-3xl font-bold tracking-tight text-zinc-950">Table Management</h2>
        <p class="text-sm text-zinc-900">Configure tables and generate QR codes.</p>
      </div>
    </div>
    
    <div class="flex items-center gap-2">
      {#if restaurants.length > 0}
        <div class="relative">
          <select 
            bind:value={selectedRestaurantId}
            class="flex h-9 w-full sm:w-[200px] items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm ring-offset-white placeholder:text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
          >
            <option value="">All Restaurants</option>
            {#each restaurants as rest}
              <option value={rest.id}>{rest.name}</option>
            {/each}
          </select>
          <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-900">
            <svg class="h-4 w-4 opacity-50" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
      {/if}
      <button 
        class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 bg-zinc-900 text-zinc-50 shadow hover:bg-zinc-900/90 h-9 px-4 py-2 gap-2" 
        onclick={() => showAddModal = true} 
        disabled={!selectedRestaurantId}
      >
        <Plus size={16} /> Add Table
      </button>
    </div>
  </div>

  {#if isLoading}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {#each Array(6) as _}
        <div class="h-[180px] rounded-xl border border-zinc-200 bg-zinc-100/50 animate-pulse"></div>
      {/each}
    </div>
  {:else if filteredTables.length === 0}
    <div class="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 p-12 text-center animate-in fade-in-50">
      <div class="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100 mb-4">
        <Grid2X2 size={32} class="text-zinc-900" />
      </div>
      <h3 class="mt-4 text-lg font-semibold text-zinc-950">No tables configured</h3>
      {#if !selectedRestaurantId}
        <p class="mb-4 mt-2 text-sm text-amber-600">Please select a restaurant to add tables.</p>
      {:else}
        <p class="mb-4 mt-2 text-sm text-zinc-900">Add the first table for this restaurant.</p>
        <button class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 bg-zinc-900 text-zinc-50 shadow hover:bg-zinc-900/90 h-9 px-4 py-2" onclick={() => showAddModal = true}>
          Add First Table
        </button>
      {/if}
    </div>
  {:else}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {#each filteredTables as table (table.id)}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="relative group h-full">
          <!-- Delete Button Form -->
          <form method="POST" action="?/delete" use:enhance={handleDeleteTable} class="absolute top-2 right-2 z-10">
            <input type="hidden" name="id" value={table.id} />
            <button 
              type="submit" 
              class="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
              onclick={(e) => {
                if (!confirm('Are you sure you want to delete this table?')) {
                  e.preventDefault();
                }
              }}
              title="Delete table"
            >
              <Trash2 size={16} />
            </button>
          </form>
          
          <div onclick={() => generateQr(table)} class="h-full">
            <Card class="cursor-pointer transition-colors hover:bg-zinc-50 text-center h-full flex flex-col justify-center py-6">
              <CardContent class="p-0 pb-0">
                <div class="text-5xl font-black text-zinc-900 tabular-nums tracking-tighter mb-2">{table.table_number}</div>
                <div class="text-sm font-semibold text-zinc-950 mb-1">{table.display_name || 'Table ' + table.table_number}</div>
                <div class="flex items-center justify-center gap-1.5 text-xs text-zinc-900 mb-4">
                  <Users size={12} />
                  {table.capacity ?? 4} seats
                </div>
                
                <div class="pt-4 border-t border-zinc-100">
                  {#if table.is_active}
                    <span class="inline-flex items-center rounded-full border border-zinc-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span> Active
                    </span>
                  {:else}
                    <span class="inline-flex items-center rounded-full border border-zinc-200 px-2 py-0.5 text-[10px] font-semibold text-zinc-900 bg-zinc-100">
                      Inactive
                    </span>
                  {/if}
                </div>

                <div class="mt-4 flex items-center justify-center gap-1.5 text-[10px] font-mono text-zinc-900 group-hover:text-zinc-600 transition-colors">
                  <QrIcon size={12} /> Tap for QR
                </div>
              </CardContent>
            </Card>
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
  <div 
    transition:fade={{ duration: 150 }}
    class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" 
    onclick={(e) => { if (e.target === e.currentTarget) showQrModal = false; }}
  >
    <div class="bg-white rounded-xl border border-zinc-200 shadow-lg w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 text-center" onclick={(e) => e.stopPropagation()}>
      <div class="relative p-6">
        <button class="absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2" onclick={() => showQrModal = false}>
          <X size={16} class="text-zinc-900" />
        </button>
        
        <div class="text-xs font-mono text-zinc-900 uppercase tracking-widest mb-1 mt-2">Table {selectedTable.table_number}</div>
        <div class="text-xl font-bold tracking-tight text-zinc-950 mb-6">{selectedTable.display_name || 'Table ' + selectedTable.table_number}</div>
        
        {#if qrDataUrl}
          <div class="inline-block p-4 rounded-xl border border-zinc-200 shadow-sm mb-6 bg-white">
            <img src={qrDataUrl} alt="QR Code" class="w-[200px] h-[200px] block" />
          </div>
        {/if}
        
        <div class="flex gap-2">
          <button onclick={downloadQr} class="inline-flex flex-1 items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 bg-zinc-900 text-zinc-50 shadow hover:bg-zinc-900/90 h-9 px-4 gap-2">
            <Download size={14} /> Download
          </button>
          <button onclick={() => window.print()} class="inline-flex flex-1 items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 border border-zinc-200 bg-white shadow-sm hover:bg-zinc-100 text-zinc-900 h-9 px-4">
            Print
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Add Table Modal -->
{#if showAddModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div 
    transition:fade={{ duration: 150 }}
    class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" 
    onclick={(e) => { if (e.target === e.currentTarget) showAddModal = false; }}
  >
    <div class="bg-white rounded-xl border border-zinc-200 shadow-lg w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onclick={(e) => e.stopPropagation()}>
      <div class="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
        <div>
          <h2 class="text-lg font-semibold tracking-tight">Add New Table</h2>
        </div>
        <button class="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2" onclick={() => showAddModal = false}>
          <X size={16} class="text-zinc-900" />
        </button>
      </div>

      <form method="POST" action="?/provision" use:enhance={handleAddTable} class="p-6 space-y-4">
        <input type="hidden" name="restaurant_id" value={selectedRestaurantId} />
        
        <div class="space-y-2">
          <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="table_number">Table Number</label>
          <input class="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50" id="table_number" name="table_number" type="number" required min="1" placeholder="7" />
        </div>
        
        <div class="space-y-2">
          <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="display_name">Display Name (Optional)</label>
          <input class="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50" id="display_name" name="display_name" placeholder="Window Seat" />
        </div>
        
        <div class="space-y-2">
          <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="capacity">Capacity</label>
          <input class="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50" id="capacity" name="capacity" type="number" min="1" max="50" value="4" />
        </div>
        
        <div class="flex gap-2 pt-2 mt-6">
          <button type="button" onclick={() => showAddModal = false} class="inline-flex flex-1 items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 border border-zinc-200 bg-white shadow-sm hover:bg-zinc-100 h-9 px-4">
            Cancel
          </button>
          <button type="submit" disabled={isSaving} class="inline-flex flex-1 items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 bg-zinc-900 text-zinc-50 shadow hover:bg-zinc-900/90 h-9 px-4">
            {isSaving ? 'Adding...' : 'Add Table'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
