<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';
	import { toast } from 'svelte-sonner';
	import QRCode from 'qrcode';
	import { Plus, Users, QrCode, Download, Printer, RefreshCw, X, Hash } from 'lucide-svelte';
	import type { Table, Restaurant } from '$lib/types';

	let restaurants = $state<Restaurant[]>([]);
	let selectedRestaurantId = $state<string | null>(null);

	let tables = $state<Table[]>([]);
	let isLoading = $state(true);
	let isSaving = $state(false);
	
	let showAddModal = $state(false);
	let showQrModal = $state(false);
	let selectedTableForQr = $state<Table | null>(null);
	let qrDataUrl = $state('');

	let newTable = $state({
		table_number: '',
		display_name: '',
		capacity: 4
	});

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
		const { data, error } = await supabase.from('tables').select('*').eq('restaurant_id', selectedRestaurantId).order('table_number');
		if (error) {
			toast.error('Failed to load tables: ' + error.message);
		} else {
			tables = data;
		}
		isLoading = false;
	}

	$effect(() => {
		if (selectedRestaurantId && restaurants.length > 0) {
			loadTables();
		}
	});

	onMount(() => {
		loadRestaurants();
	});

	async function addTable() {
		if (!supabase || !selectedRestaurantId) return;
		if (!newTable.table_number || !newTable.display_name) {
			toast.error('Required fields missing');
			return;
		}

		isSaving = true;
		const { data, error } = await supabase.from('tables').insert({
			restaurant_id: selectedRestaurantId,
			table_number: parseInt(newTable.table_number),
			display_name: newTable.display_name,
			capacity: newTable.capacity,
			is_active: true,
			status: 'free'
		}).select().single();

		if (error) {
			toast.error('Failed to add table: ' + error.message);
		} else {
			tables = [...tables, data].sort((a, b) => a.table_number - b.table_number);
			toast.success('Table provisioned');
			showAddModal = false;
			newTable = { table_number: '', display_name: '', capacity: 4 };
		}
		isSaving = false;
	}

	async function toggleTableStatus(table: Table) {
		if (!supabase) return;
		const newStatus = !table.is_active;
		const { error } = await supabase.from('tables').update({ is_active: newStatus }).eq('id', table.id);
		
		if (error) {
			toast.error('Failed to update: ' + error.message);
		} else {
			const idx = tables.findIndex(t => t.id === table.id);
			if (idx !== -1) tables[idx].is_active = newStatus;
			toast.success(`Table ${table.table_number} marked as ${newStatus ? 'active' : 'inactive'}`);
		}
	}

	async function generateQR(table: Table) {
		selectedTableForQr = table;
		const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
		const url = `${baseUrl}/table/${table.restaurant_id}/${table.id}`;
		try {
			qrDataUrl = await QRCode.toDataURL(url, {
				width: 400,
				margin: 1,
				color: { dark: '#0F172A', light: '#FFFFFF' }
			});
			showQrModal = true;
		} catch (err) {
			toast.error('Failed to generate QR code');
		}
	}

	function handlePrint() {
		window.print();
	}
</script>

<svelte:head>
	<title>Tables | Terminal</title>
</svelte:head>

<div class="space-y-6 animate-fade-in font-sans text-slate-900 pb-12">
	<div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-4">
		<div>
			<h1 class="text-2xl font-bold tracking-tight uppercase">Table Infrastructure</h1>
			<p class="text-xs text-slate-500 mt-1 font-mono uppercase tracking-widest">Physical endpoints and QR routing</p>
		</div>
		
		<div class="flex items-center gap-2">
			{#if restaurants.length > 0}
				<select class="bg-white border border-slate-200 px-3 py-1.5 outline-none focus:border-blue-500 transition-colors text-xs font-mono uppercase tracking-widest rounded-none" bind:value={selectedRestaurantId}>
					{#each restaurants as res}
						<option value={res.id}>{res.name}</option>
					{/each}
				</select>
			{/if}
			<button class="p-1.5 border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors disabled:opacity-50" onclick={loadTables} disabled={isLoading || !selectedRestaurantId}>
				<RefreshCw size={16} class={isLoading ? 'animate-spin' : ''} />
			</button>
			<button 
				class="bg-blue-600 text-white font-mono uppercase tracking-widest text-xs px-4 py-1.5 flex items-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
				onclick={() => showAddModal = true}
				disabled={!selectedRestaurantId}
			>
				<Plus size={14} /> Provision Table
			</button>
		</div>
	</div>

	<!-- Strict Table List -->
	<div class="border border-slate-200 bg-white">
		<div class="grid grid-cols-12 bg-slate-50 border-b border-slate-200 text-[10px] font-mono uppercase tracking-widest text-slate-500">
			<div class="col-span-1 p-3 border-r border-slate-200 text-center">ID</div>
			<div class="col-span-4 p-3 border-r border-slate-200">Table Configuration</div>
			<div class="col-span-2 p-3 border-r border-slate-200 text-center">Capacity</div>
			<div class="col-span-2 p-3 border-r border-slate-200 text-center">Status</div>
			<div class="col-span-3 p-3 text-center">Routing (QR)</div>
		</div>

		{#if isLoading}
			<div class="p-12 flex justify-center">
				<RefreshCw size={24} class="animate-spin text-slate-400" />
			</div>
		{:else if tables.length === 0}
			<div class="p-12 flex flex-col items-center justify-center text-center">
				<Hash size={32} class="text-slate-300 mb-4" />
				<h3 class="text-sm font-mono uppercase tracking-widest text-slate-500">No endpoints configured</h3>
			</div>
		{:else}
			<div class="divide-y divide-slate-100">
				{#each tables as table (table.id)}
					<div class="grid grid-cols-12 text-sm hover:bg-slate-50 transition-colors {table.is_active ? '' : 'opacity-60'}">
						<!-- ID -->
						<div class="col-span-1 p-3 border-r border-slate-200 flex items-center justify-center font-mono font-bold text-slate-900 bg-slate-50/50">
							{table.table_number.toString().padStart(2, '0')}
						</div>
						
						<!-- Name -->
						<div class="col-span-4 p-3 border-r border-slate-200 flex flex-col justify-center">
							<span class="font-bold uppercase tracking-tight">{table.display_name}</span>
							<span class="text-[10px] font-mono text-slate-400 truncate">{table.id}</span>
						</div>

						<!-- Capacity -->
						<div class="col-span-2 p-3 border-r border-slate-200 flex items-center justify-center gap-2 font-mono text-slate-600">
							<Users size={14} class="text-slate-400" /> {table.capacity} PAX
						</div>

						<!-- Status -->
						<div class="col-span-2 p-3 border-r border-slate-200 flex items-center justify-center">
							<button 
								class="text-[10px] font-mono uppercase tracking-widest px-2 py-1 border transition-colors {table.is_active ? 'border-green-600 text-green-700 bg-green-50' : 'border-slate-300 text-slate-500 bg-white'}"
								onclick={() => toggleTableStatus(table)}
							>
								{table.is_active ? 'ACTIVE' : 'IDLE'}
							</button>
						</div>

						<!-- Routing -->
						<div class="col-span-3 p-3 flex items-center justify-center">
							<button 
								class="flex items-center gap-2 px-3 py-1.5 border border-slate-900 bg-white hover:bg-slate-900 hover:text-white transition-colors text-xs font-mono uppercase tracking-widest"
								onclick={() => generateQR(table)}
							>
								<QrCode size={14} /> GENERATE QR
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Provision Modal -->
{#if showAddModal}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4" onclick={(e) => { if(e.target === e.currentTarget) showAddModal = false; }}>
		<div class="bg-white border-2 border-slate-900 w-full max-w-sm p-6 shadow-[8px_8px_0_0_rgba(15,23,42,1)]" onclick={(e) => e.stopPropagation()}>
			<div class="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
				<div>
					<h2 class="text-lg font-bold uppercase tracking-tight">Provision Endpoint</h2>
					<p class="text-[10px] font-mono uppercase tracking-widest text-slate-500 mt-1">Table configuration</p>
				</div>
				<button class="p-1 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200" onclick={() => showAddModal = false}><X size={16} /></button>
			</div>

			<div class="space-y-4 font-mono text-sm">
				<div class="grid grid-cols-2 gap-4">
					<div class="col-span-1 space-y-1">
						<label class="block text-xs uppercase tracking-widest text-slate-600" for="tnum">Table ID (Num)</label>
						<input id="tnum" type="number" class="w-full bg-slate-50 border-2 border-slate-900 p-2 outline-none focus:bg-white transition-colors rounded-none" bind:value={newTable.table_number} placeholder="1" />
					</div>
					<div class="col-span-1 space-y-1">
						<label class="block text-xs uppercase tracking-widest text-slate-600" for="tcap">Max Capacity</label>
						<input id="tcap" type="number" class="w-full bg-slate-50 border-2 border-slate-900 p-2 outline-none focus:bg-white transition-colors rounded-none" bind:value={newTable.capacity} placeholder="4" />
					</div>
				</div>
				<div class="space-y-1">
					<label class="block text-xs uppercase tracking-widest text-slate-600" for="tname">Display Label</label>
					<input id="tname" type="text" class="w-full bg-slate-50 border-2 border-slate-900 p-2 outline-none focus:bg-white transition-colors rounded-none" bind:value={newTable.display_name} placeholder="Table 1" />
				</div>
				
				<div class="pt-4 mt-6 border-t-2 border-slate-900">
					<button 
						class="w-full py-2 border-2 border-slate-900 bg-blue-600 text-white hover:bg-blue-700 uppercase tracking-widest text-xs font-bold transition-colors disabled:opacity-50 flex justify-center items-center gap-2 rounded-none"
						onclick={addTable}
						disabled={isSaving}
					>
						{#if isSaving}
							<RefreshCw size={14} class="animate-spin" /> EXECUTING...
						{:else}
							COMMIT ENDPOINT
						{/if}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Brutalist QR Printable Modal -->
{#if showQrModal && selectedTableForQr}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 print:p-0 print:bg-white" onclick={(e) => { if(e.target === e.currentTarget) showQrModal = false; }}>
		<div class="bg-white border-4 border-slate-900 w-full max-w-sm p-8 shadow-[12px_12px_0_0_rgba(15,23,42,1)] print:shadow-none print:border-none" onclick={(e) => e.stopPropagation()}>
			
			<div class="text-center print:block">
				<!-- Header -->
				<div class="border-b-4 border-slate-900 pb-4 mb-8">
					<h2 class="text-3xl font-black uppercase tracking-tighter">Scan To Order</h2>
					<p class="text-sm font-mono uppercase tracking-widest text-slate-500 mt-2">Digital Menu System</p>
				</div>
				
				<!-- QR Code -->
				<div class="bg-slate-50 border-4 border-slate-900 p-4 mx-auto w-64 h-64 mb-8">
					{#if qrDataUrl}
						<img src={qrDataUrl} alt="Table QR Code" class="w-full h-full [image-rendering:pixelated]" />
					{/if}
				</div>
				
				<!-- Footer Data -->
				<div class="bg-slate-900 text-white p-4 font-mono uppercase tracking-widest">
					<div class="text-xl font-bold">{selectedTableForQr.display_name}</div>
					<div class="text-[10px] mt-2 opacity-70">ENDPOINT ID: {selectedTableForQr.table_number.toString().padStart(4, '0')}</div>
				</div>
			</div>

			<!-- Actions (hidden when printing) -->
			<div class="mt-8 flex gap-2 print:hidden border-t-2 border-slate-900 pt-6">
				<button class="flex-1 py-3 border-2 border-slate-900 bg-white hover:bg-slate-100 flex justify-center items-center gap-2 uppercase font-mono tracking-widest text-xs font-bold transition-colors" onclick={() => showQrModal = false}>
					Close
				</button>
				<button class="flex-1 py-3 border-2 border-slate-900 bg-blue-600 text-white hover:bg-blue-700 flex justify-center items-center gap-2 uppercase font-mono tracking-widest text-xs font-bold transition-colors" onclick={handlePrint}>
					<Printer size={16} /> Print
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	@media print {
		:global(body) {
			background: white;
		}
		:global(.print\:hidden) {
			display: none !important;
		}
		:global(.print\:block) {
			display: block !important;
		}
		:global(.print\:shadow-none) {
			box-shadow: none !important;
		}
		:global(.print\:border-none) {
			border: none !important;
		}
		:global(.print\:bg-white) {
			background: white !important;
		}
		:global(.print\:p-0) {
			padding: 0 !important;
		}
	}
</style>
