<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import type { PageData, ActionData } from './$types';
	import { Store, User, Calendar, Plus, ExternalLink } from 'lucide-svelte';
	
	let { data, form }: { data: PageData; form: ActionData } = $props();
	
	let loading = $state(false);
	let showAddModal = $state(false);
	
	$effect(() => {
		if (form?.error) {
			toast.error(form.error);
			loading = false;
		}
		if (form?.success) {
			toast.success('Restaurant provisioned successfully!');
			loading = false;
			showAddModal = false;
		}
	});
</script>

<svelte:head>
	<title>Network Nodes | Terminal</title>
</svelte:head>

<div class="space-y-6 animate-fade-in pb-12 font-sans text-slate-900">
	<header class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-4">
		<div>
			<h1 class="text-2xl font-bold tracking-tight uppercase">Network Nodes</h1>
			<p class="text-xs text-slate-500 mt-1 font-mono uppercase tracking-widest">Provision and manage active locations</p>
		</div>
		
		<button 
			class="px-4 py-1.5 text-xs font-mono uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
			onclick={() => showAddModal = true}
		>
			<Plus size={14} /> Provision Node
		</button>
	</header>

	<!-- Dense Tabular Grid -->
	<div class="border border-slate-200 bg-white">
		<div class="grid grid-cols-12 bg-slate-50 border-b border-slate-200 text-[10px] font-mono uppercase tracking-widest text-slate-500">
			<div class="col-span-1 p-3 border-r border-slate-200 text-center">Status</div>
			<div class="col-span-4 p-3 border-r border-slate-200">Node Name / ID</div>
			<div class="col-span-4 p-3 border-r border-slate-200">Owner Identity</div>
			<div class="col-span-2 p-3 border-r border-slate-200">Deployed</div>
			<div class="col-span-1 p-3 text-center">Action</div>
		</div>

		{#if data.restaurants.length === 0}
			<div class="p-12 flex flex-col items-center justify-center text-center">
				<Store size={32} class="text-slate-300 mb-4" />
				<h3 class="text-sm font-mono uppercase tracking-widest text-slate-500">No nodes found</h3>
				<button class="mt-4 px-4 py-1.5 border border-slate-200 text-xs font-mono uppercase hover:bg-slate-50 transition-colors" onclick={() => showAddModal = true}>Provision First Node</button>
			</div>
		{:else}
			<div class="divide-y divide-slate-100">
				{#each data.restaurants as restaurant (restaurant.id)}
					<div class="grid grid-cols-12 text-sm hover:bg-slate-50 transition-colors group">
						<!-- Status -->
						<div class="col-span-1 p-3 border-r border-slate-200 flex items-center justify-center">
							<span class="w-2 h-2 bg-green-500"></span>
						</div>
						
						<!-- Name / ID -->
						<div class="col-span-4 p-3 border-r border-slate-200 flex flex-col justify-center">
							<span class="font-bold">{restaurant.name}</span>
							<span class="text-[10px] font-mono text-slate-400 mt-0.5 truncate">{restaurant.id}</span>
						</div>

						<!-- Owner -->
						<div class="col-span-4 p-3 border-r border-slate-200 flex items-center gap-2">
							<User size={14} class="text-slate-400 shrink-0" />
							<span class="font-mono text-xs truncate">{restaurant.owner_id}</span>
						</div>

						<!-- Date -->
						<div class="col-span-2 p-3 border-r border-slate-200 flex items-center gap-2 text-xs font-mono text-slate-600">
							<Calendar size={14} class="text-slate-400 shrink-0" />
							<span>{restaurant.created_at ? new Date(restaurant.created_at).toISOString().split('T')[0] : 'N/A'}</span>
						</div>

						<!-- Action -->
						<div class="col-span-1 p-3 flex items-center justify-center">
							<button class="text-slate-400 hover:text-blue-600 transition-colors" title="Manage">
								<ExternalLink size={16} />
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Brutalist Add Modal -->
{#if showAddModal}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4" onclick={(e) => { if(e.target === e.currentTarget) showAddModal = false; }}>
		<div class="bg-white border-2 border-slate-900 w-full max-w-md p-6 relative shadow-[8px_8px_0_0_rgba(15,23,42,1)]" onclick={(e) => e.stopPropagation()}>
			
			<div class="border-b-2 border-slate-900 pb-4 mb-6">
				<h2 class="text-lg font-bold uppercase tracking-tight">Provision Node</h2>
				<p class="text-[10px] font-mono uppercase tracking-widest text-slate-500 mt-1">Deploy a new restaurant identity</p>
			</div>
			
			<form 
				method="POST" 
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						await update({ reset: true });
						loading = false;
					};
				}}
				class="space-y-4 font-mono text-sm"
			>
				<div class="space-y-1">
					<label for="restaurant_name" class="block text-xs uppercase tracking-widest text-slate-600">Node Name</label>
					<input
						id="restaurant_name"
						name="restaurant_name"
						type="text"
						required
						class="w-full bg-slate-50 border-2 border-slate-900 p-2 outline-none focus:bg-white transition-colors rounded-none"
						placeholder="e.g. The Rustic Fork"
					/>
				</div>

				<div class="space-y-1">
					<label for="email" class="block text-xs uppercase tracking-widest text-slate-600">Owner Identity (Email)</label>
					<input
						id="email"
						name="email"
						type="email"
						required
						class="w-full bg-slate-50 border-2 border-slate-900 p-2 outline-none focus:bg-white transition-colors rounded-none"
						placeholder="owner@domain.com"
					/>
				</div>

				<div class="space-y-1">
					<label for="password" class="block text-xs uppercase tracking-widest text-slate-600">Initial Credential</label>
					<input
						id="password"
						name="password"
						type="password"
						required
						class="w-full bg-slate-50 border-2 border-slate-900 p-2 outline-none focus:bg-white transition-colors rounded-none"
						placeholder="••••••••"
					/>
				</div>

				<div class="pt-6 flex gap-2">
					<button type="button" class="flex-1 py-2 border-2 border-slate-900 bg-white hover:bg-slate-100 uppercase tracking-widest text-xs font-bold transition-colors rounded-none" onclick={() => showAddModal = false} disabled={loading}>
						Abort
					</button>
					<button
						type="submit"
						disabled={loading}
						class="flex-1 py-2 border-2 border-slate-900 bg-blue-600 text-white hover:bg-blue-700 uppercase tracking-widest text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-none"
					>
						{#if loading}
							Deploying...
						{:else}
							Execute
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
