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
      toast.error('FAILED TO LOAD RESTAURANTS');
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
      toast.error('FAILED TO LOAD TABLES');
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
      toast.error('SUPABASE NOT INIT');
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
      toast.error('FAILED TO GENERATE QR');
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
    toast.success('QR DOWNLOADED');
  }

  function printQR() {
    if (!generatedQrUrl || !selectedTableForQr) return;
    const win = window.open('');
    if (win) {
      win.document.write(`
        <html>
          <head><title>PRINT QR - TABLE ${selectedTableForQr.table_number}</title></head>
          <body style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:monospace; margin:0; background:#fff; color:#000;">
            <h1 style="font-size:2rem; margin-bottom:1rem; text-transform:uppercase; letter-spacing:0.1em;">${selectedTableForQr.display_name}</h1>
            <img src="${generatedQrUrl}" style="width:300px; height:300px; border: 4px solid #000;" />
            <p style="margin-top:2rem; font-size:1rem; text-transform:uppercase; letter-spacing:0.1em; font-weight:bold;">SCAN TO ACCESS TERMINAL</p>
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
      toast.error('TABLE NUMBER REQUIRED');
      return;
    }

    isSaving = true;
    const payload = {
      restaurant_id: selectedRestaurantId,
      table_number: parseInt(newTableForm.table_number),
      display_name: newTableForm.display_name || `TABLE ${newTableForm.table_number}`,
      capacity: parseInt(newTableForm.capacity) || 4,
      is_active: true
    };

    try {
      const { data, error } = await supabase.from('tables').insert(payload).select().single();
      if (error) throw error;
      
      tables = [...tables, data].sort((a, b) => a.table_number - b.table_number);
      toast.success('TABLE ADDED');
      showAddForm = false;
      newTableForm = { table_number: '', display_name: '', capacity: '4' };
    } catch (e: any) {
      toast.error('FAILED TO ADD TABLE');
    } finally {
      isSaving = false;
    }
  }
</script>

<svelte:head>
  <title>QR TERMINAL</title>
</svelte:head>

<div class="h-full flex flex-col font-mono text-text-primary uppercase">
  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border pb-4 mb-4 gap-4">
    <div>
      <h1 class="text-2xl font-bold tracking-widest">QR & Tables</h1>
      <p class="text-xs text-text-secondary mt-1 tracking-wide">Access Code Management</p>
    </div>
    
    <div class="flex flex-wrap gap-2 w-full sm:w-auto items-center text-xs">
      {#if restaurants.length > 0}
        <select class="bg-transparent border border-border px-2 py-1 outline-none uppercase" bind:value={selectedRestaurantId}>
          {#each restaurants as res}
            <option value={res.id}>{res.name}</option>
          {/each}
        </select>
      {/if}
      
      <button 
        class="border border-brand text-brand hover:bg-brand hover:text-black px-4 py-1 flex items-center gap-2 transition-colors disabled:opacity-50"
        onclick={() => showAddForm = !showAddForm}
        disabled={!selectedRestaurantId}
      >
        <Plus size={14} /> NEW TABLE
      </button>
    </div>
  </div>

  <div class="flex-1 flex flex-col border border-border overflow-hidden">
    {#if showAddForm}
      <div class="p-4 bg-surface border-b border-border text-xs">
        <h3 class="font-bold tracking-widest mb-4">ALLOCATE NEW TABLE</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div class="flex flex-col gap-1">
            <label class="text-[10px] text-text-secondary tracking-widest" for="table-num">TABLE NUMBER</label>
            <input id="table-num" type="number" class="bg-black border border-border p-2 outline-none focus:border-brand" bind:value={newTableForm.table_number} />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-[10px] text-text-secondary tracking-widest" for="table-name">DISPLAY NAME</label>
            <input id="table-name" type="text" class="bg-black border border-border p-2 outline-none focus:border-brand" placeholder="OPTIONAL" bind:value={newTableForm.display_name} />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-[10px] text-text-secondary tracking-widest" for="table-cap">CAPACITY</label>
            <input id="table-cap" type="number" class="bg-black border border-border p-2 outline-none focus:border-brand" bind:value={newTableForm.capacity} />
          </div>
        </div>
        <div class="flex justify-end gap-2">
          <button class="px-4 py-2 border border-border hover:bg-card text-text-secondary" onclick={() => showAddForm = false} disabled={isSaving}>ABORT</button>
          <button class="px-4 py-2 bg-brand text-black font-bold hover:bg-brand/80 disabled:opacity-50 flex items-center gap-2" onclick={saveTable} disabled={isSaving}>
            {#if isSaving}
              <RefreshCw size={14} class="animate-spin" /> EXECUTING...
            {:else}
              COMMIT
            {/if}
          </button>
        </div>
      </div>
    {/if}

    <div class="flex-1 overflow-y-auto bg-black">
      {#if isLoading}
        <div class="h-full flex items-center justify-center">
          <RefreshCw size={24} class="animate-spin text-brand opacity-50" />
        </div>
      {:else if tables.length === 0}
        <div class="h-full flex flex-col items-center justify-center text-text-secondary text-xs tracking-widest">
          NO TABLES FOUND.
        </div>
      {:else}
        <table class="w-full text-left border-collapse text-xs">
          <thead class="sticky top-0 bg-surface z-10 border-b border-border">
            <tr class="text-[10px] text-text-secondary tracking-widest">
              <th class="p-3 font-normal w-16 border-r border-border">NUM</th>
              <th class="p-3 font-normal border-r border-border">DISPLAY NAME</th>
              <th class="p-3 font-normal w-24 border-r border-border text-center">CAPACITY</th>
              <th class="p-3 font-normal w-32 border-r border-border text-center">QR GEN</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border/30">
            {#each tables as table (table.id)}
              <tr class="hover:bg-surface/30 group">
                <td class="p-3 border-r border-border/30 font-bold text-brand">{table.table_number}</td>
                <td class="p-3 border-r border-border/30">{table.display_name}</td>
                <td class="p-3 border-r border-border/30 text-center text-text-secondary font-mono">{table.capacity} PAX</td>
                <td class="p-3 text-center">
                  <button 
                    class="text-[10px] font-bold px-2 py-1 border border-border hover:border-brand hover:text-brand flex items-center justify-center gap-2 mx-auto w-full transition-colors"
                    onclick={() => generateQR(table)}
                  >
                    <QrCode size={12} /> EXTRACT
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>
  </div>
</div>

<!-- Brutalist QR Modal -->
{#if qrModalOpen && selectedTableForQr}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 font-mono uppercase text-xs animate-fade-in" onclick={(e) => { if(e.target === e.currentTarget) qrModalOpen = false; }}>
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div role="dialog" class="bg-black border border-white w-full max-w-sm flex flex-col items-center animate-slide-up relative cursor-default" onclick={(e) => e.stopPropagation()}>
      
      <div class="w-full bg-white text-black p-2 flex justify-between items-center font-bold tracking-widest border-b border-white">
        <span>ACCESS MATRIX</span>
        <button class="hover:text-red-500" onclick={() => qrModalOpen = false}>
          <X size={16} />
        </button>
      </div>

      <div class="p-8 w-full flex flex-col items-center text-white">
        <div class="text-center mb-6 w-full">
          <h2 class="text-2xl font-bold">{selectedTableForQr.display_name}</h2>
          <p class="text-[10px] text-gray-400 mt-1">TABLE NODE {selectedTableForQr.table_number}</p>
        </div>

        <div class="bg-white p-4 mb-8">
          {#if generatedQrUrl}
            <img src={generatedQrUrl} alt="QR" class="w-48 h-48 rendering-pixelated" />
          {/if}
        </div>

        <div class="flex w-full gap-2 text-[10px] font-bold">
          <button 
            class="flex-1 py-2 border border-white hover:bg-white hover:text-black transition-colors flex items-center justify-center gap-2"
            onclick={downloadQR}
          >
            <Download size={14} /> DUMP PNG
          </button>
          <button 
            class="flex-1 py-2 border border-brand text-brand hover:bg-brand hover:text-black transition-colors flex items-center justify-center gap-2"
            onclick={printQR}
          >
            <Printer size={14} /> LPR/SPOOL
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
