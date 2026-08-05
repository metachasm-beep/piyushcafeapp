<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import type { PageData, ActionData } from './$types';
	
	let { data, form }: { data: PageData; form: ActionData } = $props();
	
	let loading = $state(false);
	
	$effect(() => {
		if (form?.error) {
			toast.error(form.error);
			loading = false;
		}
		if (form?.success) {
			toast.success('NODE PROVISIONED SUCCESSFULLY');
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>RESTAURANT NODES</title>
</svelte:head>

<div class="max-w-[1400px] mx-auto space-y-6 font-mono text-text-primary animate-fade-in">
	<header class="flex justify-between items-end border-b border-border pb-4">
		<div>
			<h1 class="text-2xl font-bold uppercase tracking-widest">Network Nodes</h1>
			<p class="text-xs text-text-secondary mt-1 uppercase tracking-wide">Manage Restaurants & Owners</p>
		</div>
	</header>

	<div class="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
		<!-- Provisioning Form (Sidebar) -->
		<div class="lg:col-span-1 border border-border flex flex-col sticky top-6">
			<div class="p-2 bg-surface border-b border-border">
				<h2 class="text-xs font-bold uppercase tracking-widest">Provision Node</h2>
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
				class="flex flex-col p-4 gap-4"
			>
				<div class="flex flex-col gap-1">
					<label for="restaurant_name" class="text-[10px] text-text-secondary uppercase tracking-widest">Node Name</label>
					<input
						id="restaurant_name"
						name="restaurant_name"
						type="text"
						required
						class="bg-transparent border border-border p-2 text-xs outline-none focus:border-brand transition-colors rounded-none"
						placeholder="E.G. THE RUSTIC FORK"
					/>
				</div>

				<div class="flex flex-col gap-1">
					<label for="email" class="text-[10px] text-text-secondary uppercase tracking-widest">Owner Identity</label>
					<input
						id="email"
						name="email"
						type="email"
						required
						class="bg-transparent border border-border p-2 text-xs outline-none focus:border-brand transition-colors rounded-none"
						placeholder="OWNER@RUSTICFORK.COM"
					/>
				</div>

				<div class="flex flex-col gap-1">
					<label for="password" class="text-[10px] text-text-secondary uppercase tracking-widest">Initial Credential</label>
					<input
						id="password"
						name="password"
						type="password"
						required
						class="bg-transparent border border-border p-2 text-xs outline-none focus:border-brand transition-colors rounded-none"
						placeholder="••••••••"
					/>
				</div>

				<button
					type="submit"
					disabled={loading}
					class="mt-2 p-2 border border-brand text-brand hover:bg-brand hover:text-black uppercase text-xs tracking-widest font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-none"
				>
					{#if loading}
						EXECUTING...
					{:else}
						PROVISION
					{/if}
				</button>
			</form>
		</div>

		<!-- Restaurants List (Data Table) -->
		<div class="lg:col-span-3 border border-border flex flex-col">
			<div class="flex justify-between items-center p-2 bg-surface border-b border-border">
				<h2 class="text-xs font-bold uppercase tracking-widest">Active Nodes</h2>
				<div class="text-[10px] text-text-secondary uppercase">Count: {data.restaurants.length}</div>
			</div>
			
			{#if data.restaurants.length === 0}
				<div class="p-8 text-center text-xs text-text-secondary uppercase tracking-widest">
					NO NODES PROVISIONED.
				</div>
			{:else}
				<div class="overflow-x-auto">
					<table class="w-full text-left border-collapse text-xs">
						<thead>
							<tr class="bg-surface/50 border-b border-border/50 text-[10px] text-text-secondary">
								<th class="p-3 font-normal uppercase tracking-widest">NODE ID</th>
								<th class="p-3 font-normal uppercase tracking-widest">NAME</th>
								<th class="p-3 font-normal uppercase tracking-widest">OWNER ID</th>
								<th class="p-3 font-normal uppercase tracking-widest">CREATED</th>
								<th class="p-3 font-normal uppercase tracking-widest">STATUS</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border/30">
							{#each data.restaurants as restaurant (restaurant.id)}
								<tr class="hover:bg-surface/30 group">
									<td class="p-3 font-mono text-[10px] text-text-secondary/70 truncate max-w-[100px]">{restaurant.id}</td>
									<td class="p-3 font-bold text-brand uppercase">{restaurant.name}</td>
									<td class="p-3 font-mono text-[10px] text-text-secondary/70 truncate max-w-[100px]">{restaurant.owner_id}</td>
									<td class="p-3 text-text-secondary">
										{restaurant.created_at ? new Date(restaurant.created_at).toISOString().split('T')[0] : 'N/A'}
									</td>
									<td class="p-3 text-green-500 font-bold">ONLINE</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	</div>
</div>
