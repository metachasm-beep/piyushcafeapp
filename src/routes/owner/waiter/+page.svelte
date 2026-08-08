<script lang="ts">
	import { Users, Clock, CheckCircle2, AlertCircle, RefreshCw, UtensilsCrossed } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import { adminOrders, waiterRequests } from '$lib/stores/admin';

	let { data } = $props();
	
	let staff = $derived(data.staff);
	let isAvailable = $derived(staff?.is_available);
	
	// Real-time derived stores instead of static data
	let orders = $derived($adminOrders.filter(o => o.assigned_waiter_id === staff?.id && o.status !== 'paid' && o.status !== 'cancelled').sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
	let requests = $derived($waiterRequests.filter(r => r.assigned_waiter_id === staff?.id && r.status === 'pending').sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
	
	let isToggling = $state(false);
	let resolvingId = $state<string | null>(null);

	// Swipe Action for GPU-Accelerated Swipe-to-Resolve
	function swipeable(node: HTMLElement, { onSwipeRight }: { onSwipeRight: () => void }) {
		let startX = 0;
		let currentX = 0;
		
		function handleTouchStart(e: TouchEvent) {
			startX = e.touches[0].clientX;
			node.style.transition = 'none';
		}
		
		function handleTouchMove(e: TouchEvent) {
			currentX = e.touches[0].clientX - startX;
			if (currentX > 0 && currentX < 150) {
				node.style.transform = `translateX(${currentX}px)`;
				node.style.opacity = `${1 - (currentX / 200)}`;
			}
		}
		
		function handleTouchEnd() {
			node.style.transition = 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease';
			if (currentX > 100) {
				onSwipeRight();
			} else {
				node.style.transform = '';
				node.style.opacity = '1';
			}
			currentX = 0;
		}
		
		node.addEventListener('touchstart', handleTouchStart, { passive: true });
		node.addEventListener('touchmove', handleTouchMove, { passive: true });
		node.addEventListener('touchend', handleTouchEnd);
		
		return {
			destroy() {
				node.removeEventListener('touchstart', handleTouchStart);
				node.removeEventListener('touchmove', handleTouchMove);
				node.removeEventListener('touchend', handleTouchEnd);
			}
		}
	}
</script>

<svelte:head>
	<title>Terminal | Waiter Dashboard</title>
</svelte:head>

<!-- Full Bleed Dark Mode Override -->
<div class="-m-4 md:-m-6 lg:-m-8 p-4 md:p-6 lg:p-8 bg-zinc-950 min-h-[calc(100vh-60px)] text-zinc-300 font-mono">
	<div class="space-y-6 max-w-6xl mx-auto">
		<!-- Header -->
		<div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-zinc-900 pb-6">
			<div class="flex items-center gap-4">
				<div class="w-12 h-12 rounded-none bg-zinc-900 flex items-center justify-center border border-zinc-800 text-zinc-100">
					<Users size={24} />
				</div>
				<div>
					<h1 class="text-2xl font-bold tracking-tight text-white uppercase">Terminal [Waiter]</h1>
					<p class="text-xs text-zinc-500 mt-0.5 tracking-widest uppercase">System Active</p>
				</div>
			</div>

			<div class="bg-zinc-900 rounded-none p-2 flex items-center gap-4 border border-zinc-800 shadow-inner">
				<span class="text-xs font-bold tracking-widest text-zinc-500 pl-2 uppercase">Status:</span>
				<form method="POST" action="?/toggleAvailability" use:enhance={() => { isToggling = true; return async ({ update }) => { await update(); isToggling = false; } }}>
					<input type="hidden" name="is_available" value={(!isAvailable).toString()} />
					<button type="submit" disabled={isToggling} class="px-4 py-2 font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 {isAvailable ? 'bg-zinc-950 text-blue-400 border border-blue-900 hover:bg-blue-950' : 'bg-zinc-950 text-zinc-600 border border-zinc-800 hover:bg-zinc-900'}">
						<span class="w-2.5 h-2.5 rounded-full {isAvailable ? 'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.6)]' : 'bg-zinc-600'}"></span>
						{isAvailable ? 'Clocked In' : 'Clocked Out'}
					</button>
				</form>
			</div>
		</div>

		{#if !isAvailable}
			<div class="p-8 bg-zinc-900 border border-zinc-800 text-center space-y-4">
				<Clock size={48} class="mx-auto text-zinc-700" />
				<h2 class="text-xl font-bold text-white tracking-tight uppercase">System Offline</h2>
				<p class="text-zinc-500 text-sm">Awaiting clock-in sequence...</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
				<!-- Active Requests -->
				<div class="space-y-4">
					<div class="flex items-center justify-between border-b border-zinc-800 pb-2">
						<div class="flex items-center gap-2">
							<AlertCircle size={16} class="text-red-500" />
							<h2 class="text-sm font-bold text-white uppercase tracking-wider">Table Requests</h2>
						</div>
						<span class="text-xs font-bold text-red-500 bg-red-950 px-2 py-0.5 border border-red-900">{requests.length}</span>
					</div>
					
					{#if requests.length === 0}
						<div class="p-8 bg-zinc-900 border border-zinc-800 text-center text-zinc-600 text-sm tracking-widest uppercase">
							No pending requests
						</div>
					{/if}

					<div class="space-y-3">
						{#each requests as req}
							<div class="relative overflow-hidden group">
								<!-- Swipe action background indicator -->
								<div class="absolute inset-0 bg-blue-900 border border-blue-800 flex items-center px-6">
									<CheckCircle2 class="text-blue-400" />
									<span class="ml-2 font-bold text-blue-400 text-sm tracking-widest uppercase">Resolve</span>
								</div>
								
								<!-- Swipeable Card -->
								<div 
									use:swipeable={{ onSwipeRight: () => document.getElementById(`resolve-form-${req.id}`)?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })) }}
									class="relative p-5 bg-zinc-900 border border-zinc-800 will-change-transform z-10 touch-pan-y"
								>
									<div class="flex justify-between items-start gap-4">
										<div>
											<div class="flex items-center gap-3 mb-2">
												<span class="px-2 py-0.5 bg-red-950 border border-red-900 text-red-400 text-xs font-bold uppercase tracking-widest">
													{req.table?.display_name || `TBL ${req.table?.table_number}`}
												</span>
												<span class="text-[10px] text-zinc-500 font-bold uppercase">
													{new Date(req.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}
												</span>
											</div>
											<p class="text-white font-medium text-sm mt-2">{req.message || 'CUSTOMER ASSISTANCE REQ.'}</p>
										</div>
										<form id={`resolve-form-${req.id}`} method="POST" action="?/resolveRequest" use:enhance={() => { resolvingId = req.id; return async ({ update }) => { await update(); resolvingId = null; } }}>
											<input type="hidden" name="request_id" value={req.id} />
											<button type="submit" disabled={resolvingId === req.id} class="hidden md:flex w-10 h-10 bg-zinc-800 text-zinc-400 border border-zinc-700 items-center justify-center hover:bg-blue-900 hover:text-blue-400 hover:border-blue-800 transition-colors disabled:opacity-50">
												{#if resolvingId === req.id}
													<RefreshCw size={16} class="animate-spin text-blue-400" />
												{:else}
													<CheckCircle2 size={16} />
												{/if}
											</button>
										</form>
									</div>
									<div class="mt-3 md:hidden">
										<p class="text-[10px] text-zinc-600 font-bold uppercase tracking-widest flex items-center gap-1">
											<span class="animate-pulse-ring h-1 w-1 bg-zinc-500 rounded-full inline-block"></span> Swipe right to resolve
										</p>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>

				<!-- Active Orders -->
				<div class="space-y-4">
					<div class="flex items-center justify-between border-b border-zinc-800 pb-2">
						<div class="flex items-center gap-2">
							<UtensilsCrossed size={16} class="text-zinc-400" />
							<h2 class="text-sm font-bold text-white uppercase tracking-wider">Active Orders</h2>
						</div>
						<span class="text-xs font-bold text-zinc-400 bg-zinc-900 px-2 py-0.5 border border-zinc-800">{orders.length}</span>
					</div>
					
					{#if orders.length === 0}
						<div class="p-8 bg-zinc-900 border border-zinc-800 text-center text-zinc-600 text-sm tracking-widest uppercase">
							No assigned orders
						</div>
					{/if}

					<div class="space-y-3">
						{#each orders as order}
							<div class="p-5 bg-zinc-900 border border-zinc-800">
								<div class="flex items-center justify-between mb-4 pb-4 border-b border-zinc-800">
									<div class="flex items-center gap-3">
										<span class="text-white text-lg font-bold">
											{order.table?.display_name || `TBL ${order.table?.table_number}`}
										</span>
										<span class="text-[10px] text-zinc-500 font-bold uppercase">
											{new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}
										</span>
									</div>
									<div class="px-2 py-1 text-[10px] font-bold uppercase tracking-widest border
										{order.status === 'pending' ? 'bg-orange-950/50 text-orange-400 border-orange-900/50' :
										 order.status === 'preparing' ? 'bg-purple-950/50 text-purple-400 border-purple-900/50' :
										 order.status === 'ready' ? 'bg-emerald-950/50 text-emerald-400 border-emerald-900/50' :
										 'bg-zinc-800 text-zinc-400 border-zinc-700'}
									">
										{order.status}
									</div>
								</div>
								
								<div class="flex justify-between items-end">
									<div>
										<p class="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mb-1">Payment</p>
										<div class="text-xs font-bold uppercase {order.payment_status === 'paid' ? 'text-emerald-400' : 'text-red-400'}">
											[{order.payment_status}]
										</div>
									</div>
									<div class="text-right">
										<p class="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mb-1">Total</p>
										<p class="font-bold text-white">₹{order.total_amount}</p>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
