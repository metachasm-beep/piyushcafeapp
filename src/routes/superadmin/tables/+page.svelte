<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import QRCode from 'qrcode';
  import { QrCode, Users, Plus, Download, Printer, X, RefreshCw } from '@lucide/svelte';
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
      toast.error('Failed to load restaurants: ' + error.message);
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
      toast.error('Failed to load tables: ' + error.message);
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
      toast.error('Supabase client not initialized.');
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
      toast.error('Failed to generate QR code');
      console.error(err);
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
    toast.success('QR Code downloaded');
  }

  function printQR() {
    if (!generatedQrUrl || !selectedTableForQr) return;
    const win = window.open('');
    if (win) {
      win.document.write(`
        <html>
          <head><title>Print QR - Table ${selectedTableForQr.table_number}</title></head>
          <body style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:sans-serif; margin:0;">
            <h1 style="font-size:3rem; margin-bottom:1rem;">Table ${selectedTableForQr.table_number}</h1>
            <img src="${generatedQrUrl}" style="width:400px; height:400px;" />
            <p style="margin-top:2rem; font-size:1.5rem; color:#555;">Scan to view menu & order</p>
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
      toast.error('Table Number is required');
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
      toast.error('Failed to add table: ' + e.message);
    } finally {
      isSaving = false;
    }
  }
</script>

<div class="space-y-6">
  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <div>
      <h1 class="text-3xl font-display font-bold text-[var(--color-text-primary)]">Tables & QR Codes</h1>
      <p class="text-[var(--color-text-secondary)] mt-1">Manage restaurant seating and access codes</p>
    </div>
    
    <div class="flex items-center gap-3 w-full sm:w-auto">
      {#if restaurants.length > 0}
        <select class="input-dark rounded-lg py-2 w-full sm:w-auto" bind:value={selectedRestaurantId}>
          {#each restaurants as res}
            <option value={res.id}>{res.name}</option>
          {/each}
        </select>
      {/if}
      
      <button class="btn-brand flex items-center gap-2 whitespace-nowrap" onclick={() => showAddForm = !showAddForm} disabled={!selectedRestaurantId}>
        <Plus size={18} />
        <span class="hidden sm:inline">Add Table</span>
      </button>
    </div>
  </div>

  {#if showAddForm}
    <div class="glass p-6 rounded-xl animate-slide-up border border-[var(--color-brand)]/30">
      <h3 class="font-bold text-lg mb-4">Add New Table</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label class="block text-sm text-[var(--color-text-secondary)] mb-1" for="table-num">Table Number</label>
          <input id="table-num" type="number" class="input-dark w-full" placeholder="e.g. 7" bind:value={newTableForm.table_number} />
        </div>
        <div>
          <label class="block text-sm text-[var(--color-text-secondary)] mb-1" for="table-name">Display Name</label>
          <input id="table-name" type="text" class="input-dark w-full" placeholder="e.g. Balcony 1 (Optional)" bind:value={newTableForm.display_name} />
        </div>
        <div>
          <label class="block text-sm text-[var(--color-text-secondary)] mb-1" for="table-cap">Capacity</label>
          <input id="table-cap" type="number" class="input-dark w-full" placeholder="e.g. 4" bind:value={newTableForm.capacity} />
        </div>
      </div>
      <div class="flex justify-end gap-3">
        <button class="btn-ghost" onclick={() => showAddForm = false} disabled={isSaving}>Cancel</button>
        <button class="btn-brand flex items-center gap-2" onclick={saveTable} disabled={isSaving}>
          {#if isSaving}
            <RefreshCw size={16} class="animate-spin" /> Saving...
          {:else}
            Save Table
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
    <div class="glass h-64 flex flex-col items-center justify-center text-[var(--color-text-secondary)] rounded-xl">
      <p>No tables found for this restaurant.</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {#each tables as table (table.id)}
        <div class="glass p-5 rounded-xl border border-[var(--color-border)] flex flex-col relative overflow-hidden group">
          
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="font-display font-bold text-2xl text-[var(--color-brand)]">{table.display_name}</h3>
              <p class="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">Table {table.table_number}</p>
            </div>
            <div class="flex items-center gap-1 text-[var(--color-text-secondary)] bg-[var(--color-surface)] px-2 py-1 rounded-md border border-[var(--color-border)]">
              <Users size={14} />
              <span class="text-sm font-bold">{table.capacity}</span>
            </div>
          </div>

          <div class="mt-auto pt-4 flex gap-2">
            <button 
              class="flex-1 py-2 bg-[var(--color-card)] hover:bg-[var(--color-brand)] hover:text-white border border-[var(--color-border)] hover:border-[var(--color-brand)] rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 group/btn"
              onclick={() => generateQR(table)}
            >
              <QrCode size={16} class="group-hover/btn:scale-110 transition-transform" />
              Get QR Code
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- QR Modal -->
{#if qrModalOpen && selectedTableForQr}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onclick={(e) => { if(e.target === e.currentTarget) qrModalOpen = false; }}>
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div role="dialog" class="bg-white text-black w-full max-w-sm rounded-2xl p-8 flex flex-col items-center animate-slide-up relative shadow-2xl cursor-default" onclick={(e) => e.stopPropagation()}>
      
      <button class="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors" onclick={() => qrModalOpen = false}>
        <X size={24} />
      </button>

      <div class="text-center mb-6 w-full mt-2">
        <h2 class="text-3xl font-black">{selectedTableForQr.display_name}</h2>
        <p class="text-gray-500 font-medium">Scan to order</p>
      </div>

      <div class="bg-white p-2 rounded-xl shadow-inner border border-gray-100 mb-8 w-full flex justify-center">
        {#if generatedQrUrl}
          <img src={generatedQrUrl} alt="QR Code" class="w-64 h-64 object-contain" />
        {/if}
      </div>

      <div class="flex w-full gap-3">
        <button 
          class="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
          onclick={downloadQR}
        >
          <Download size={18} /> Download
        </button>
        <button 
          class="flex-1 py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
          onclick={printQR}
        >
          <Printer size={18} /> Print
        </button>
      </div>
    </div>
  </div>
{/if}
