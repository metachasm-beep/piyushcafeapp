<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import QRCode from 'qrcode';
  import { QrCode, Users, Plus, Download, Printer, X, RefreshCw } from 'lucide-svelte';
  import { toast } from 'svelte-sonner';
  import type { Table, Restaurant } from '$lib/types';

  let restaurants = $state<Restaurant[]>([]);
  let selectedRestaurantId = $state<string | null>(null);

  let tables = $state<Table[]>([]);
  let isLoading = $state(true);
  
  let qrModalOpen = $state(false);
  let selectedTableForQr = $state<Table | null>(null);
  let generatedQrUrl = $state('');

  async function loadRestaurants() {
    if (!supabase) return;
    isLoading = true;
    const { data, error } = await supabase.from('restaurants').select('*').order('name');
    if (error) {
      toast.error('Failed to load restaurants');
    } else {
      restaurants = data;
      if (restaurants.length > 0) {
        selectedRestaurantId = restaurants[0].id;
        await loadTables();
      } else {
        isLoading = false;
      }
    }
  }

  async function loadTables() {
    if (!supabase || !selectedRestaurantId) return;
    isLoading = true;
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .eq('restaurant_id', selectedRestaurantId)
      .order('table_number');
      
    if (error) {
      toast.error('Failed to load tables');
    } else {
      tables = data || [];
    }
    isLoading = false;
  }

  $effect(() => {
    if (selectedRestaurantId && restaurants.length > 0) {
      loadTables();
    }
  });

  onMount(() => {
    if (!supabase) {
      toast.error('Supabase not initialized');
      isLoading = false;
      return;
    }
    loadRestaurants();
  });

  async function generateQR(table: Table) {
    selectedTableForQr = table;
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
    const url = `${baseUrl}/table/${table.restaurant_id}/${table.id}`;
    
    try {
      generatedQrUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      qrModalOpen = true;
    } catch (err) {
      toast.error('Failed to generate QR');
    }
  }

  function downloadQR() {
    if (!generatedQrUrl || !selectedTableForQr) return;
    const link = document.createElement('a');
    link.download = `table-${selectedTableForQr.table_number}-qr.png`;
    link.href = generatedQrUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR Downloaded');
  }

  function printQR() {
    if (!generatedQrUrl || !selectedTableForQr) return;
    const win = window.open('');
    if (win) {
      win.document.write(`
        <html>
          <head><title>Print QR - Table ${selectedTableForQr.table_number}</title></head>
          <body style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:sans-serif; margin:0; background:#fff; color:#000;">
            <h1 style="font-size:3rem; margin-bottom:1rem; letter-spacing:-0.02em;">${selectedTableForQr.display_name}</h1>
            <img src="${generatedQrUrl}" style="width:400px; height:400px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);" />
            <p style="margin-top:2.5rem; font-size:1.25rem; font-weight:600; color:#555;">Scan with camera to order</p>
          </body>
        </html>
      `);
      win.document.close();
      win.focus();
      setTimeout(() => {
        win.print();
        win.close();
      }, 500);
    }
  }
  
  let showAddForm = $state(false);
  let isSaving = $state(false);
  let newTableForm = $state({
    table_number: '',
    display_name: '',
    capacity: '4'
  });

  async function saveTable() {
    if (!supabase || !selectedRestaurantId) return;
    if (!newTableForm.table_number) {
      toast.error('Table number required');
      return;
    }

    isSaving = true;
    const payload = {
      restaurant_id: selectedRestaurantId,
      table_number: parseInt(newTableForm.table_number),
      display_name: newTableForm.display_name || `Table ${newTableForm.table_number}`,
      capacity: parseInt(newTableForm.capacity) || 4,
      is_active: true
    };

    try {
      const { data, error } = await supabase.from('tables').insert(payload).select().single();
      if (error) throw error;
      
      tables = [...tables, data].sort((a, b) => a.table_number - b.table_number);
      toast.success('Table added successfully');
      showAddForm = false;
      newTableForm = { table_number: '', display_name: '', capacity: '4' };
    } catch (e: any) {
      toast.error('Failed to add table');
    } finally {
      isSaving = false;
    }
  }
</script>

<svelte:head>
  <title>Tables & QR | Management Console</title>
</svelte:head>

<div class="space-y-8 animate-fade-in pb-12 font-sans text-text-primary">
  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
    <div>
      <h1 class="text-3xl font-display font-bold tracking-tight">Tables & QR Codes</h1>
      <p class="text-text-secondary mt-1 font-medium">Manage restaurant seating and digital access points.</p>
    </div>
    
    <div class="flex flex-wrap gap-3 w-full sm:w-auto items-center">
      {#if restaurants.length > 0}
        <select class="bg-black/20 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 outline-none focus:border-brand transition-colors text-sm font-medium" bind:value={selectedRestaurantId}>
          {#each restaurants as res}
            <option value={res.id}>{res.name}</option>
          {/each}
        </select>
      {/if}
      
      <button 
        class="bg-brand text-black font-semibold rounded-full px-5 py-2 flex items-center gap-2 hover:bg-brand-hover hover:scale-105 shadow-glow transition-all text-sm disabled:opacity-50"
        onclick={() => showAddForm = !showAddForm}
        disabled={!selectedRestaurantId}
      >
        <Plus size={16} /> Add Table
      </button>
    </div>
  </div>

  {#if showAddForm}
    <div class="glass-panel p-8 rounded-3xl animate-slide-up border border-brand/30 shadow-[0_0_30px_rgba(251,146,60,0.1)]">
      <h3 class="font-bold text-xl mb-6">Allocate New Table</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-text-secondary pl-1" for="table-num">Table Number</label>
          <input id="table-num" type="number" class="w-full bg-black/20 border border-white/10 rounded-2xl p-3 text-sm outline-none focus:border-brand transition-all backdrop-blur-md" placeholder="e.g. 7" bind:value={newTableForm.table_number} />
        </div>
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-text-secondary pl-1" for="table-name">Display Name</label>
          <input id="table-name" type="text" class="w-full bg-black/20 border border-white/10 rounded-2xl p-3 text-sm outline-none focus:border-brand transition-all backdrop-blur-md" placeholder="e.g. Balcony 1 (Optional)" bind:value={newTableForm.display_name} />
        </div>
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-text-secondary pl-1" for="table-cap">Capacity</label>
          <input id="table-cap" type="number" class="w-full bg-black/20 border border-white/10 rounded-2xl p-3 text-sm outline-none focus:border-brand transition-all backdrop-blur-md" placeholder="e.g. 4" bind:value={newTableForm.capacity} />
        </div>
      </div>
      <div class="flex justify-end gap-3">
        <button class="px-6 py-2.5 rounded-full bg-white/5 hover:bg-white/10 font-medium transition-colors" onclick={() => showAddForm = false} disabled={isSaving}>Cancel</button>
        <button class="px-6 py-2.5 rounded-full bg-brand text-black font-semibold hover:bg-brand-hover hover:shadow-glow transition-all disabled:opacity-50 flex items-center gap-2" onclick={saveTable} disabled={isSaving}>
          {#if isSaving}
            <RefreshCw size={16} class="animate-spin" /> Provisioning...
          {:else}
            Provision Table
          {/if}
        </button>
      </div>
    </div>
  {/if}

  {#if isLoading}
    <div class="h-64 flex items-center justify-center">
      <RefreshCw size={32} class="animate-spin text-brand opacity-50" />
    </div>
  {:else if tables.length === 0}
    <div class="glass-panel h-64 flex flex-col items-center justify-center text-text-secondary rounded-3xl">
      <p class="font-medium">No tables configured for this location.</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {#each tables as table (table.id)}
        <div class="glass-strong p-6 rounded-3xl border border-white/5 hover:border-white/10 flex flex-col relative overflow-hidden group hover:-translate-y-1 hover:shadow-float transition-all duration-300">
          
          <div class="flex justify-between items-start mb-6">
            <div>
              <h3 class="font-display font-bold text-2xl text-white truncate pr-2">{table.display_name}</h3>
              <p class="text-xs text-text-secondary font-medium tracking-wide mt-1">Table {table.table_number}</p>
            </div>
            <div class="flex items-center gap-1.5 text-brand bg-brand/10 px-3 py-1 rounded-full shrink-0">
              <Users size={14} />
              <span class="text-sm font-bold">{table.capacity}</span>
            </div>
          </div>

          <div class="mt-auto pt-4 flex gap-2">
            <button 
              class="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-2xl text-sm font-medium transition-all flex items-center justify-center gap-2 group-hover:bg-brand group-hover:text-black group-hover:border-brand"
              onclick={() => generateQR(table)}
            >
              <QrCode size={16} />
              Get QR Pass
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Apple Wallet Style QR Pass Modal -->
{#if qrModalOpen && selectedTableForQr}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in" onclick={(e) => { if(e.target === e.currentTarget) qrModalOpen = false; }}>
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div role="dialog" class="w-full max-w-sm flex flex-col items-center animate-slide-up relative cursor-default group" onclick={(e) => e.stopPropagation()}>
      
      <!-- The Wallet Pass -->
      <div class="w-full bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden border border-white/10">
        <!-- Shine effect -->
        <div class="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:animate-[shimmer_2s_infinite]"></div>
        
        <button class="absolute top-5 right-5 text-text-secondary hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full p-2" onclick={() => qrModalOpen = false}>
          <X size={18} />
        </button>

        <div class="text-center mb-8 mt-2 w-full">
          <h2 class="text-2xl font-bold text-white tracking-tight">{selectedTableForQr.display_name}</h2>
          <p class="text-sm font-medium text-brand mt-1 uppercase tracking-wider">Access Pass</p>
        </div>

        <!-- The QR Code (White background for scannability) -->
        <div class="bg-white p-3 rounded-2xl shadow-inner mb-10 w-full flex justify-center mx-auto relative group/qr">
          {#if generatedQrUrl}
            <img src={generatedQrUrl} alt="QR" class="w-full aspect-square object-contain rounded-xl" />
          {/if}
        </div>

        <div class="flex w-full gap-3 relative z-10">
          <button 
            class="flex-1 py-3.5 px-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all backdrop-blur-md"
            onclick={downloadQR}
          >
            <Download size={18} /> Save
          </button>
          <button 
            class="flex-1 py-3.5 px-4 bg-white text-black hover:bg-gray-200 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all"
            onclick={printQR}
          >
            <Printer size={18} /> Print
          </button>
        </div>
      </div>
      
      <!-- Wallet pass notch/hanger illusion -->
      <div class="absolute -top-3 w-16 h-3 bg-zinc-900 rounded-t-xl border-t border-x border-white/10 opacity-50"></div>
    </div>
  </div>
{/if}

<style>
  @keyframes shimmer {
    100% {
      transform: translateX(100%);
    }
  }
</style>
