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

<div class="space-y-16 animate-fade-in font-sans text-slate-900 pb-16">
	<!-- Editorial Header -->
	<header class="border-b-2 border-slate-900 pb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-6">
		<div class="max-w-2xl">
			<h1 class="text-5xl md:text-6xl font-display font-black tracking-tighter leading-none italic pr-4">Table<br />Infrastructure.</h1>
			<p class="text-sm text-slate-500 mt-6 font-mono uppercase tracking-widest leading-relaxed">
				Physical endpoints and QR routing for the selected node.
			</p>
		</div>
		
		<div class="flex items-center gap-4 border-l border-slate-200 pl-6 shrink-0">
			{#if restaurants.length > 0}
				<select class="bg-transparent border-b border-slate-300 px-2 py-1 outline-none focus:border-slate-900 transition-colors text-xs font-mono uppercase tracking-widest" bind:value={selectedRestaurantId}>
					{#each restaurants as res}
						<option value={res.id}>{res.name}</option>
					{/each}
				</select>
			{/if}
			<button class="text-xs font-mono uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors disabled:opacity-50" onclick={loadTables} disabled={isLoading || !selectedRestaurantId}>
				[ Refresh ]
			</button>
			<button 
				class="text-xs font-mono uppercase tracking-widest text-emerald-600 hover:text-emerald-500 transition-colors disabled:opacity-50"
				onclick={() => showAddModal = true}
				disabled={!selectedRestaurantId}
			>
				[ Provision Table ]
			</button>
		</div>
	</header>

	<!-- Editorial Ledger -->
	<div>
		{#if isLoading}
			<div class="py-24 flex justify-center border-t border-b border-slate-200">
				<RefreshCw size={24} class="animate-spin text-slate-300" />
			</div>
		{:else if tables.length === 0}
			<div class="py-24 flex flex-col items-center justify-center text-center border-t border-b border-slate-200">
				<h3 class="font-display text-3xl font-bold italic text-slate-300 mb-2">No Endpoints</h3>
				<p class="text-xs font-mono uppercase tracking-widest text-slate-400">Configure a table to begin</p>
			</div>
		{:else}
			<div class="divide-y border-b border-slate-200">
				{#each tables as table (table.id)}
					<div class="py-8 flex flex-col md:flex-row md:items-center gap-8 group {table.is_active ? '' : 'opacity-50'}">
						
						<!-- Massive Serif ID -->
						<div class="w-24 shrink-0 flex items-baseline gap-1">
							<span class="text-xs font-mono text-slate-300 mb-4">No.</span>
							<span class="text-6xl font-display font-bold italic text-slate-900 group-hover:text-emerald-700 transition-colors tracking-tighter">
								{table.table_number}
							</span>
						</div>
						
						<!-- Details -->
						<div class="flex-1 flex flex-col justify-center">
							<span class="text-2xl font-bold uppercase tracking-tight text-slate-900">{table.display_name}</span>
							<span class="text-[10px] font-mono text-slate-400 truncate mt-1">ID: {table.id}</span>
						</div>

						<!-- Capacity -->
						<div class="w-32 flex flex-col gap-1">
							<span class="text-[10px] font-mono uppercase tracking-widest text-slate-400">Capacity</span>
							<span class="font-mono text-sm text-slate-900 flex items-center gap-2">
								<Users size={14} class="text-slate-300" /> {table.capacity} PAX
							</span>
						</div>

						<!-- Status Toggle -->
						<div class="w-32 flex flex-col gap-1">
							<span class="text-[10px] font-mono uppercase tracking-widest text-slate-400">Status</span>
							<button 
								class="text-left text-xs font-mono uppercase tracking-widest transition-colors {table.is_active ? 'text-emerald-600' : 'text-slate-400 line-through hover:text-slate-900'}"
								onclick={() => toggleTableStatus(table)}
							>
								{table.is_active ? 'Active' : 'Idle'}
							</button>
						</div>

						<!-- Actions -->
						<div class="w-40 flex justify-end shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
							<button 
								class="text-xs font-mono uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors flex items-center gap-2"
								onclick={() => generateQR(table)}
							>
								[ GENERATE QR ]
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Editorial Provision Modal -->
{#if showAddModal}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 bg-[#f8f9fa]/95 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onclick={(e) => { if(e.target === e.currentTarget) showAddModal = false; }}>
		<div class="w-full max-w-xl bg-white p-12 md:p-16 relative shadow-2xl" onclick={(e) => e.stopPropagation()}>
			
			<div class="border-b-2 border-slate-900 pb-6 mb-10">
				<h2 class="text-4xl font-display font-black tracking-tighter italic">Provision.</h2>
				<p class="text-xs font-mono uppercase tracking-widest text-slate-500 mt-4">Table Endpoint Configuration</p>
			</div>

			<div class="space-y-8 font-mono text-sm">
				<div class="grid grid-cols-2 gap-8">
					<div class="col-span-1 space-y-3">
						<label class="block text-[10px] uppercase tracking-widest text-slate-500" for="tnum">Table ID (Num)</label>
						<input id="tnum" type="number" class="w-full bg-transparent border-b border-slate-300 py-2 outline-none focus:border-slate-900 transition-colors placeholder:text-slate-300 text-lg" bind:value={newTable.table_number} placeholder="1" />
					</div>
					<div class="col-span-1 space-y-3">
						<label class="block text-[10px] uppercase tracking-widest text-slate-500" for="tcap">Max Capacity</label>
						<input id="tcap" type="number" class="w-full bg-transparent border-b border-slate-300 py-2 outline-none focus:border-slate-900 transition-colors placeholder:text-slate-300 text-lg" bind:value={newTable.capacity} placeholder="4" />
					</div>
				</div>
				<div class="space-y-3">
					<label class="block text-[10px] uppercase tracking-widest text-slate-500" for="tname">Display Label</label>
					<input id="tname" type="text" class="w-full bg-transparent border-b border-slate-300 py-2 outline-none focus:border-slate-900 transition-colors placeholder:text-slate-300 text-lg" bind:value={newTable.display_name} placeholder="Table 1" />
				</div>
				
				<div class="pt-8 flex gap-6 mt-10 border-t-2 border-slate-900">
					<button class="text-xs font-mono uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors" onclick={() => showAddModal = false} disabled={isSaving}>[ Abort ]</button>
					<button 
						class="text-xs font-mono uppercase tracking-widest text-emerald-600 hover:text-emerald-500 transition-colors disabled:opacity-50"
						onclick={addTable}
						disabled={isSaving}
					>
						{#if isSaving}
							[ Executing... ]
						{:else}
							[ Commit Endpoint ]
						{/if}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Editorial QR Printable Modal -->
{#if showQrModal && selectedTableForQr}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 bg-[#f8f9fa]/95 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:p-0 print:bg-white animate-fade-in" onclick={(e) => { if(e.target === e.currentTarget) showQrModal = false; }}>
		<div class="bg-white border w-full max-w-sm p-12 relative shadow-2xl print:shadow-none print:border-none" onclick={(e) => e.stopPropagation()}>
			
			<div class="text-center print:block">
				<!-- Header -->
				<div class="mb-10">
					<h2 class="text-4xl font-display font-black italic tracking-tighter">Scan to<br/>Order.</h2>
					<p class="text-xs font-mono uppercase tracking-widest text-slate-500 mt-4 border-b border-slate-200 pb-4 inline-block">Digital Menu System</p>
				</div>
				
				<!-- QR Code -->
				<div class="mx-auto w-64 h-64 mb-10">
					{#if qrDataUrl}
						<img src={qrDataUrl} alt="Table QR Code" class="w-full h-full [image-rendering:pixelated]" />
					{/if}
				</div>
				
				<!-- Footer Data -->
				<div class="text-center font-mono">
					<div class="text-2xl font-bold uppercase tracking-tight text-slate-900">{selectedTableForQr.display_name}</div>
					<div class="text-[10px] mt-2 text-slate-400 uppercase tracking-widest">Endpoint: {selectedTableForQr.table_number.toString().padStart(4, '0')}</div>
				</div>
			</div>

			<!-- Actions (hidden when printing) -->
			<div class="mt-12 flex gap-6 print:hidden border-t-2 border-slate-900 pt-8 justify-center">
				<button class="text-xs font-mono uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors" onclick={() => showQrModal = false}>
					[ Close ]
				</button>
				<button class="text-xs font-mono uppercase tracking-widest text-emerald-600 hover:text-emerald-500 transition-colors" onclick={handlePrint}>
					[ Print ]
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
