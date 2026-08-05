<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import type { PageData, ActionData } from './$types';
	import { Store, User, Calendar, Plus } from 'lucide-svelte';
	
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
	<title>Restaurants | Management Console</title>
</svelte:head>

<div class="space-y-8 animate-fade-in pb-12 font-sans text-text-primary">
	<header class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/5 pb-6">
		<div>
			<h1 class="text-3xl font-display font-bold tracking-tight">Network Nodes</h1>
			<p class="text-text-secondary mt-1 font-medium">Manage and provision new restaurant locations.</p>
		</div>
		
		<button 
			class="px-5 py-2 text-sm font-medium rounded-full bg-brand text-black hover:bg-brand-hover shadow-glow transition-all hover:scale-105 flex items-center gap-2"
			onclick={() => showAddModal = true}
		>
			<Plus size={16} /> Provision Node
		</button>
	</header>

	<!-- Restaurants Grid -->
	<div>
		{#if data.restaurants.length === 0}
			<div class="glass-panel p-12 rounded-3xl flex flex-col items-center justify-center text-center">
				<Store size={48} class="text-white/20 mb-4" />
				<h3 class="text-xl font-bold mb-2">No nodes found</h3>
				<p class="text-text-secondary">Provision your first restaurant node to get started.</p>
				<button class="mt-6 px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors font-medium" onclick={() => showAddModal = true}>Provision Node</button>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each data.restaurants as restaurant (restaurant.id)}
					<div class="glass-strong rounded-3xl p-6 flex flex-col group hover:-translate-y-1 hover:shadow-float transition-all duration-300 border border-white/5 hover:border-white/10 relative overflow-hidden">
						<div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand to-brand-hover opacity-0 group-hover:opacity-100 transition-opacity"></div>
						
						<div class="flex justify-between items-start mb-6">
							<div class="p-3 bg-white/5 rounded-2xl text-brand group-hover:scale-110 transition-transform">
								<Store size={24} />
							</div>
							<div class="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-semibold flex items-center gap-1.5">
								<span class="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_currentColor]"></span>
								Online
							</div>
						</div>
						
						<h3 class="text-xl font-bold mb-4">{restaurant.name}</h3>
						
						<div class="space-y-3 mt-auto pt-4 border-t border-white/5">
							<div class="flex items-center gap-3 text-sm text-text-secondary">
								<User size={14} class="opacity-50" />
								<span class="font-mono text-xs truncate">{restaurant.owner_id}</span>
							</div>
							<div class="flex items-center gap-3 text-sm text-text-secondary">
								<Calendar size={14} class="opacity-50" />
								<span>{restaurant.created_at ? new Date(restaurant.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}</span>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Add Modal -->
{#if showAddModal}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in" onclick={(e) => { if(e.target === e.currentTarget) showAddModal = false; }}>
		<div class="glass-panel w-full max-w-md rounded-[2rem] p-8 shadow-float animate-slide-up relative" onclick={(e) => e.stopPropagation()}>
			
			<h2 class="text-2xl font-bold mb-1">Provision Node</h2>
			<p class="text-sm text-text-secondary mb-8">Deploy a new restaurant and owner identity.</p>
			
			<form 
				method="POST" 
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						await update({ reset: true });
						loading = false;
					};
				}}
				class="space-y-5"
			>
				<div class="space-y-1.5">
					<label for="restaurant_name" class="block text-sm font-medium text-text-secondary pl-1">Node Name</label>
					<input
						id="restaurant_name"
						name="restaurant_name"
						type="text"
						required
						class="w-full bg-black/20 border border-white/10 rounded-2xl p-3.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/50 transition-all backdrop-blur-md"
						placeholder="e.g. The Rustic Fork"
					/>
				</div>

				<div class="space-y-1.5">
					<label for="email" class="block text-sm font-medium text-text-secondary pl-1">Owner Identity (Email)</label>
					<input
						id="email"
						name="email"
						type="email"
						required
						class="w-full bg-black/20 border border-white/10 rounded-2xl p-3.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/50 transition-all backdrop-blur-md"
						placeholder="owner@domain.com"
					/>
				</div>

				<div class="space-y-1.5">
					<label for="password" class="block text-sm font-medium text-text-secondary pl-1">Initial Credential</label>
					<input
						id="password"
						name="password"
						type="password"
						required
						class="w-full bg-black/20 border border-white/10 rounded-2xl p-3.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/50 transition-all backdrop-blur-md"
						placeholder="••••••••"
					/>
				</div>

				<div class="pt-4 flex gap-3">
					<button type="button" class="flex-1 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 font-medium transition-colors" onclick={() => showAddModal = false} disabled={loading}>
						Cancel
					</button>
					<button
						type="submit"
						disabled={loading}
						class="flex-1 py-3.5 rounded-2xl bg-brand text-black font-semibold hover:bg-brand-hover hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{#if loading}
							Deploying...
						{:else}
							Provision
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
