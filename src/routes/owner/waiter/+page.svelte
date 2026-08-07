<script lang="ts">
	import { Users, Clock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-svelte';
	import { enhance } from '$app/forms';

	let { data } = $props();
	
	let staff = $derived(data.staff);
	let isAvailable = $derived(staff?.is_available);
	let orders = $derived(data.assignedOrders || []);
	let requests = $derived(data.assignedRequests || []);
	let isToggling = $state(false);
	let resolvingId = $state<string | null>(null);
</script>

<svelte:head>
	<title>Waiter Dashboard | Restaurant</title>
</svelte:head>

<div class="space-y-6 animate-fade-up">
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
		<div class="flex items-center gap-4">
			<div class="w-12 h-12 rounded-xl bg-[var(--color-brand)]/10 flex items-center justify-center border border-[var(--color-brand)]/30 text-[var(--color-brand)]">
				<Users size={24} />
			</div>
			<div>
				<h1 class="text-3xl font-display text-[var(--color-text)]">Waiter Dashboard</h1>
				<p class="text-[var(--color-text-secondary)]">Manage your tables and active requests.</p>
			</div>
		</div>

		<div class="glass-strong rounded-xl p-2 flex items-center gap-4 border border-[var(--color-border)]">
			<span class="text-sm font-bold text-[var(--color-text-secondary)] pl-2">Status:</span>
			<form method="POST" action="?/toggleAvailability" use:enhance={() => { isToggling = true; return async ({ update }) => { await update(); isToggling = false; } }}>
				<input type="hidden" name="is_available" value={(!isAvailable).toString()} />
				<button type="submit" disabled={isToggling} class="px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-sm flex items-center gap-2 {isAvailable ? 'bg-green-500/20 text-green-500 border border-green-500/30 hover:bg-green-500/30' : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)]'}">
					<span class="w-2.5 h-2.5 rounded-full {isAvailable ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-[var(--color-text-muted)]'}"></span>
					{isAvailable ? 'Clocked In (Available)' : 'Clocked Out (Offline)'}
				</button>
			</form>
		</div>
	</div>

	{#if !isAvailable}
		<div class="p-6 rounded-2xl glass-strong border border-[var(--color-border)] text-center space-y-3">
			<Clock size={48} class="mx-auto text-[var(--color-text-muted)]" />
			<h2 class="text-xl font-bold text-[var(--color-text)]">You are currently Clocked Out</h2>
			<p class="text-[var(--color-text-secondary)]">Clock in to start receiving table assignments and customer requests.</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- Active Requests -->
			<div class="space-y-4">
				<div class="flex items-center gap-2 mb-2">
					<AlertCircle size={20} class="text-red-500" />
					<h2 class="text-lg font-bold text-[var(--color-text)]">Table Requests ({requests.length})</h2>
				</div>
				
				{#if requests.length === 0}
					<div class="p-8 rounded-2xl glass-strong border border-[var(--color-border)] text-center text-[var(--color-text-muted)]">
						No pending table requests.
					</div>
				{/if}

				{#each requests as req}
					<div class="p-5 rounded-2xl glass-strong border border-red-500/30 bg-red-500/5 relative overflow-hidden group">
						<div class="flex justify-between items-start gap-4">
							<div>
								<div class="flex items-center gap-2 mb-1">
									<span class="px-2.5 py-1 rounded-md bg-red-500 text-white text-xs font-bold uppercase tracking-wide">
										{req.table?.display_name || `Table ${req.table?.table_number}`}
									</span>
									<span class="text-xs text-[var(--color-text-muted)] font-mono">
										{new Date(req.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
									</span>
								</div>
								<p class="text-[var(--color-text)] font-medium text-lg">{req.message || 'Customer needs assistance'}</p>
							</div>
							<form method="POST" action="?/resolveRequest" use:enhance={() => { resolvingId = req.id; return async ({ update }) => { await update(); resolvingId = null; } }}>
								<input type="hidden" name="request_id" value={req.id} />
								<button type="submit" disabled={resolvingId === req.id} class="w-10 h-10 rounded-xl bg-green-500/20 text-green-500 border border-green-500/30 flex items-center justify-center hover:bg-green-500 hover:text-white transition-all disabled:opacity-50">
									{#if resolvingId === req.id}
										<RefreshCw size={20} class="animate-spin" />
									{:else}
										<CheckCircle2 size={20} />
									{/if}
								</button>
							</form>
						</div>
					</div>
				{/each}
			</div>

			<!-- Active Orders -->
			<div class="space-y-4">
				<div class="flex items-center gap-2 mb-2">
					<UtensilsCrossed size={20} class="text-[var(--color-brand)]" />
					<h2 class="text-lg font-bold text-[var(--color-text)]">Active Orders ({orders.length})</h2>
				</div>
				
				{#if orders.length === 0}
					<div class="p-8 rounded-2xl glass-strong border border-[var(--color-border)] text-center text-[var(--color-text-muted)]">
						No active orders assigned to you.
					</div>
				{/if}

				{#each orders as order}
					<div class="p-5 rounded-2xl glass-strong border border-[var(--color-border)]">
						<div class="flex items-center justify-between mb-3 border-b border-[var(--color-border)] pb-3">
							<div class="flex items-center gap-2">
								<span class="px-2.5 py-1 rounded-md bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text)] text-sm font-bold">
									{order.table?.display_name || `Table ${order.table?.table_number}`}
								</span>
								<span class="text-xs text-[var(--color-text-muted)] font-mono">
									{new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
								</span>
							</div>
							<div class="px-2 py-1 rounded text-xs font-bold uppercase tracking-wider
								{order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
								 order.status === 'preparing' ? 'bg-blue-500/20 text-blue-500' :
								 order.status === 'ready' ? 'bg-green-500/20 text-green-500' :
								 'bg-[var(--color-text-muted)]/20 text-[var(--color-text-muted)]'}
							">
								{order.status}
							</div>
						</div>
						
						<div class="flex justify-between items-end">
							<div>
								<p class="text-xs text-[var(--color-text-secondary)] mb-1">Payment Status</p>
								<div class="px-2 py-0.5 rounded text-xs font-bold inline-block {order.payment_status === 'paid' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}">
									{order.payment_status.toUpperCase()}
								</div>
							</div>
							<div class="text-right">
								<p class="text-xs text-[var(--color-text-secondary)] mb-1">Total Amount</p>
								<p class="font-bold text-[var(--color-text)]">₹{order.total_amount}</p>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
