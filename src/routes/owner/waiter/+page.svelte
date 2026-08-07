<script lang="ts">
	import { Users, Clock, CheckCircle2, AlertCircle, RefreshCw, UtensilsCrossed } from 'lucide-svelte';
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
			<div class="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center border border-zinc-200 text-zinc-700">
				<Users size={24} />
			</div>
			<div>
				<h1 class="text-2xl font-bold tracking-tight text-zinc-950">Waiter Dashboard</h1>
				<p class="text-sm text-zinc-500 mt-0.5">Manage your tables and active requests.</p>
			</div>
		</div>

		<div class="bg-white rounded-xl p-2 flex items-center gap-4 border border-zinc-200 shadow-sm">
			<span class="text-sm font-semibold text-zinc-500 pl-2">Status:</span>
			<form method="POST" action="?/toggleAvailability" use:enhance={() => { isToggling = true; return async ({ update }) => { await update(); isToggling = false; } }}>
				<input type="hidden" name="is_available" value={(!isAvailable).toString()} />
				<button type="submit" disabled={isToggling} class="px-4 py-2 rounded-lg font-semibold text-sm transition-all shadow-sm flex items-center gap-2 {isAvailable ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' : 'bg-zinc-100 text-zinc-600 border border-zinc-200 hover:bg-zinc-200'}">
					<span class="w-2.5 h-2.5 rounded-full {isAvailable ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-zinc-400'}"></span>
					{isAvailable ? 'Clocked In (Available)' : 'Clocked Out (Offline)'}
				</button>
			</form>
		</div>
	</div>

	{#if !isAvailable}
		<div class="p-8 rounded-2xl bg-white border border-zinc-200 shadow-sm text-center space-y-3">
			<Clock size={48} class="mx-auto text-zinc-300" />
			<h2 class="text-xl font-bold text-zinc-900">You are currently Clocked Out</h2>
			<p class="text-zinc-500">Clock in to start receiving table assignments and customer requests.</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- Active Requests -->
			<div class="space-y-4">
				<div class="flex items-center gap-2 mb-2">
					<AlertCircle size={20} class="text-red-500" />
					<h2 class="text-lg font-bold text-zinc-950">Table Requests ({requests.length})</h2>
				</div>
				
				{#if requests.length === 0}
					<div class="p-8 rounded-2xl bg-white border border-zinc-200 text-center text-zinc-400 font-medium shadow-sm">
						No pending table requests.
					</div>
				{/if}

				{#each requests as req}
					<div class="p-5 rounded-xl bg-red-50/50 border border-red-100 relative overflow-hidden group shadow-sm">
						<div class="flex justify-between items-start gap-4">
							<div>
								<div class="flex items-center gap-2 mb-1">
									<span class="px-2.5 py-1 rounded-md bg-red-500 text-white text-xs font-bold uppercase tracking-wider">
										{req.table?.display_name || `Table ${req.table?.table_number}`}
									</span>
									<span class="text-xs text-zinc-500 font-medium">
										{new Date(req.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
									</span>
								</div>
								<p class="text-zinc-900 font-semibold text-lg">{req.message || 'Customer needs assistance'}</p>
							</div>
							<form method="POST" action="?/resolveRequest" use:enhance={() => { resolvingId = req.id; return async ({ update }) => { await update(); resolvingId = null; } }}>
								<input type="hidden" name="request_id" value={req.id} />
								<button type="submit" disabled={resolvingId === req.id} class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50">
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
					<UtensilsCrossed size={20} class="text-zinc-900" />
					<h2 class="text-lg font-bold text-zinc-950">Active Orders ({orders.length})</h2>
				</div>
				
				{#if orders.length === 0}
					<div class="p-8 rounded-2xl bg-white border border-zinc-200 text-center text-zinc-400 font-medium shadow-sm">
						No active orders assigned to you.
					</div>
				{/if}

				{#each orders as order}
					<div class="p-5 rounded-xl bg-white border border-zinc-200 shadow-sm">
						<div class="flex items-center justify-between mb-3 border-b border-zinc-100 pb-3">
							<div class="flex items-center gap-2">
								<span class="px-2.5 py-1 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-900 text-sm font-bold">
									{order.table?.display_name || `Table ${order.table?.table_number}`}
								</span>
								<span class="text-xs text-zinc-500 font-medium">
									{new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
								</span>
							</div>
							<div class="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider
								{order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
								 order.status === 'preparing' ? 'bg-indigo-100 text-indigo-700' :
								 order.status === 'ready' ? 'bg-emerald-100 text-emerald-700' :
								 'bg-zinc-100 text-zinc-600'}
							">
								{order.status}
							</div>
						</div>
						
						<div class="flex justify-between items-end">
							<div>
								<p class="text-xs text-zinc-500 font-medium mb-1">Payment Status</p>
								<div class="px-2 py-0.5 rounded text-xs font-bold inline-block {order.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}">
									{order.payment_status.toUpperCase()}
								</div>
							</div>
							<div class="text-right">
								<p class="text-xs text-zinc-500 font-medium mb-1">Total Amount</p>
								<p class="font-bold text-zinc-950">₹{order.total_amount}</p>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
