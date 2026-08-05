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
			toast.success('Restaurant and owner provisioned successfully!');
			loading = false;
		}
	});
</script>

<div class="min-h-screen bg-[var(--color-bg)] p-6 lg:p-12 text-[var(--color-text-primary)]">
	<div class="max-w-6xl mx-auto space-y-12">
		<header class="flex justify-between items-center">
			<div>
				<h1 class="text-4xl font-display text-[var(--color-brand)] mb-2">Superadmin Dashboard</h1>
				<p class="text-[var(--color-text-secondary)]">Manage restaurants and owners</p>
			</div>
		</header>

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
			<!-- Provisioning Form -->
			<div class="lg:col-span-1">
				<div class="glass-strong p-6 rounded-2xl sticky top-6">
					<h2 class="text-xl font-display mb-4">Provision New Restaurant</h2>
					
					<form 
						method="POST" 
						use:enhance={() => {
							loading = true;
							return async ({ update }) => {
								await update({ reset: true });
								loading = false;
							};
						}}
						class="space-y-4"
					>
						<div>
							<label for="restaurant_name" class="block text-sm text-[var(--color-text-secondary)] mb-1">Restaurant Name</label>
							<input
								id="restaurant_name"
								name="restaurant_name"
								type="text"
								required
								class="input-dark w-full"
								placeholder="e.g. The Rustic Fork"
							/>
						</div>

						<div>
							<label for="email" class="block text-sm text-[var(--color-text-secondary)] mb-1">Owner Email</label>
							<input
								id="email"
								name="email"
								type="email"
								required
								class="input-dark w-full"
								placeholder="owner@rusticfork.com"
							/>
						</div>

						<div>
							<label for="password" class="block text-sm text-[var(--color-text-secondary)] mb-1">Owner Password</label>
							<input
								id="password"
								name="password"
								type="password"
								required
								class="input-dark w-full"
								placeholder="Temporary password"
							/>
						</div>

						<button
							type="submit"
							disabled={loading}
							class="btn-brand w-full mt-4"
						>
							{#if loading}
								Provisioning...
							{:else}
								Create Restaurant & Owner
							{/if}
						</button>
					</form>
				</div>
			</div>

			<!-- Restaurants List -->
			<div class="lg:col-span-2 space-y-4">
				<h2 class="text-xl font-display mb-4">Existing Restaurants</h2>
				
				{#if data.restaurants.length === 0}
					<div class="glass p-8 rounded-2xl text-center text-[var(--color-text-secondary)]">
						No restaurants provisioned yet.
					</div>
				{:else}
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						{#each data.restaurants as restaurant (restaurant.id)}
							<div class="glass p-6 rounded-2xl animate-fade-in">
								<h3 class="text-lg font-bold text-[var(--color-brand)]">{restaurant.name}</h3>
								<div class="text-sm text-[var(--color-text-secondary)] mt-2 break-all space-y-1">
									<p><span class="font-bold">ID:</span> {restaurant.id}</p>
									<p><span class="font-bold">Owner ID:</span> {restaurant.owner_id}</p>
									{#if restaurant.created_at}
										<p><span class="font-bold">Created:</span> {new Date(restaurant.created_at).toLocaleDateString()}</p>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
