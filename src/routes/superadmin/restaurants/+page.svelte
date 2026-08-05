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

<div class="space-y-16 animate-fade-in pb-16 font-sans text-slate-900">
	<header class="border-b-2 border-slate-900 pb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-6">
		<div class="max-w-2xl">
			<h1 class="text-5xl md:text-6xl font-display font-black tracking-tighter leading-none italic pr-4">Network<br />Nodes.</h1>
			<p class="text-sm text-slate-500 mt-6 font-mono uppercase tracking-widest leading-relaxed">
				Active locations, owner identities, and deployment logs across the platform.
			</p>
		</div>
		
		<button 
			class="text-xs font-mono uppercase tracking-widest text-emerald-600 hover:text-emerald-500 transition-colors shrink-0"
			onclick={() => showAddModal = true}
		>
			[ Provision New Node ]
		</button>
	</header>

	<!-- Editorial List -->
	<div>
		{#if data.restaurants.length === 0}
			<div class="py-24 flex flex-col items-center justify-center text-center border-b border-slate-200">
				<h3 class="font-display text-3xl font-bold italic text-slate-300 mb-6">No nodes found</h3>
				<button class="text-xs font-mono uppercase tracking-widest text-emerald-600 hover:text-emerald-500 transition-colors" onclick={() => showAddModal = true}>[ Provision First Node ]</button>
			</div>
		{:else}
			<div class="divide-y border-b border-slate-200">
				{#each data.restaurants as restaurant (restaurant.id)}
					<div class="py-12 flex flex-col md:flex-row md:items-baseline gap-6 group relative">
						<!-- Name & ID -->
						<div class="md:w-1/3 flex flex-col">
							<h3 class="text-3xl font-display font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{restaurant.name}</h3>
							<span class="text-[10px] font-mono text-slate-400 mt-2">ID: {restaurant.id}</span>
						</div>

						<!-- Details Ledger -->
						<div class="md:w-2/3 grid grid-cols-1 sm:grid-cols-3 gap-6 font-mono text-xs">
							<!-- Owner -->
							<div class="flex flex-col gap-2">
								<span class="text-[10px] uppercase tracking-widest text-slate-400">Owner Identity</span>
								<span class="text-slate-700 truncate">{restaurant.owner_id}</span>
							</div>

							<!-- Deployed -->
							<div class="flex flex-col gap-2">
								<span class="text-[10px] uppercase tracking-widest text-slate-400">Deployed</span>
								<span class="text-slate-700">{restaurant.created_at ? new Date(restaurant.created_at).toISOString().split('T')[0] : 'Unknown'}</span>
							</div>

							<!-- Status & Action -->
							<div class="flex flex-col gap-2 sm:items-end">
								<span class="text-[10px] uppercase tracking-widest text-slate-400">Status</span>
								<div class="flex items-center gap-4">
									<span class="flex items-center gap-2 text-emerald-600">
										<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
										Active
									</span>
									<button class="text-slate-300 hover:text-slate-900 transition-colors" title="Manage Node" onclick={() => toast.info('Node managed externally')}>
										<ExternalLink size={16} />
									</button>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Editorial Add Modal -->
{#if showAddModal}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 bg-[#f8f9fa]/95 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onclick={(e) => { if(e.target === e.currentTarget) showAddModal = false; }}>
		<div class="w-full max-w-xl bg-white p-12 md:p-16 relative shadow-2xl" onclick={(e) => e.stopPropagation()}>
			
			<div class="border-b-2 border-slate-900 pb-6 mb-10">
				<h2 class="text-4xl font-display font-black tracking-tighter italic">Provision.</h2>
				<p class="text-xs font-mono uppercase tracking-widest text-slate-500 mt-4">Deploy a new restaurant identity</p>
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
				class="space-y-8 font-mono text-sm"
			>
				<div class="space-y-3">
					<label for="restaurant_name" class="block text-[10px] uppercase tracking-widest text-slate-500">Node Name</label>
					<input
						id="restaurant_name"
						name="restaurant_name"
						type="text"
						required
						class="w-full bg-transparent border-b border-slate-300 py-2 outline-none focus:border-slate-900 transition-colors placeholder:text-slate-300 text-slate-900 text-lg"
						placeholder="The Rustic Fork"
					/>
				</div>

				<div class="space-y-3">
					<label for="email" class="block text-[10px] uppercase tracking-widest text-slate-500">Owner Identity (Email)</label>
					<input
						id="email"
						name="email"
						type="email"
						required
						class="w-full bg-transparent border-b border-slate-300 py-2 outline-none focus:border-slate-900 transition-colors placeholder:text-slate-300 text-slate-900 text-lg"
						placeholder="owner@domain.com"
					/>
				</div>

				<div class="space-y-3">
					<label for="password" class="block text-[10px] uppercase tracking-widest text-slate-500">Initial Credential</label>
					<input
						id="password"
						name="password"
						type="password"
						required
						class="w-full bg-transparent border-b border-slate-300 py-2 outline-none focus:border-slate-900 transition-colors placeholder:text-slate-300 text-slate-900 text-lg"
						placeholder="••••••••"
					/>
				</div>

				<div class="pt-8 flex gap-6">
					<button type="button" class="text-xs font-mono uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors" onclick={() => showAddModal = false} disabled={loading}>
						[ Abort ]
					</button>
					<button
						type="submit"
						disabled={loading}
						class="text-xs font-mono uppercase tracking-widest text-emerald-600 hover:text-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{#if loading}
							[ Deploying... ]
						{:else}
							[ Execute Deployment ]
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
