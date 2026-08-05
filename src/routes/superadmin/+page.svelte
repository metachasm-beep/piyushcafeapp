<script lang="ts">
	import { TrendingUp, Users, ShoppingBag, Store, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-svelte';
	import { formatCurrency } from '$lib/utils';

	// Mock data for network-wide stats
	const stats = [
		{
			label: 'Total Revenue',
			value: 24589.50,
			isCurrency: true,
			trend: 12.5,
			icon: TrendingUp,
			color: 'text-green-400',
			bg: 'bg-green-500/10'
		},
		{
			label: 'Active Restaurants',
			value: 12,
			isCurrency: false,
			trend: 0,
			icon: Store,
			color: 'text-brand',
			bg: 'bg-brand/10'
		},
		{
			label: 'Total Orders',
			value: 843,
			isCurrency: false,
			trend: 8.2,
			icon: ShoppingBag,
			color: 'text-blue-400',
			bg: 'bg-blue-500/10'
		},
		{
			label: 'Active Customers',
			value: 1245,
			isCurrency: false,
			trend: -2.4,
			icon: Users,
			color: 'text-red-400',
			bg: 'bg-red-500/10'
		}
	];

	const recentActivity = [
		{ id: 1, restaurant: 'Downtown Bistro', action: 'New menu item added', time: '10:42 AM', status: 'OK' },
		{ id: 2, restaurant: 'Westside Grill', action: 'High volume alert', time: '10:25 AM', status: 'WARN' },
		{ id: 3, restaurant: 'North Branch', action: 'Printer disconnected', time: '09:12 AM', status: 'ERR' },
		{ id: 4, restaurant: 'Eastside Cafe', action: 'Daily report generated', time: '08:00 AM', status: 'INFO' },
		{ id: 5, restaurant: 'Midtown Diner', action: 'Order #8842 canceled', time: '07:45 AM', status: 'WARN' }
	];

	function getStatusColor(status: string) {
		switch (status) {
			case 'OK': return 'text-green-400';
			case 'WARN': return 'text-amber-400';
			case 'ERR': return 'text-red-400';
			default: return 'text-blue-400';
		}
	}
</script>

<svelte:head>
	<title>Global Telemetry</title>
</svelte:head>

<div class="space-y-8 animate-fade-in pb-12">
	<header class="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
		<div>
			<h1 class="text-3xl font-display font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-white/60">Global Telemetry</h1>
			<p class="text-text-secondary mt-1 font-medium">Real-time metrics across all active nodes.</p>
		</div>
		<div class="flex gap-3">
			<button class="px-5 py-2 text-sm font-medium rounded-full glass hover:bg-white/10 transition-colors">Export Report</button>
			<button class="px-5 py-2 text-sm font-medium rounded-full bg-brand text-black hover:bg-brand-hover shadow-glow transition-all hover:scale-105">New Node</button>
		</div>
	</header>

	<!-- Bento Stats -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
		{#each stats as stat}
			<div class="glass-panel p-6 rounded-3xl flex flex-col gap-4 group hover:-translate-y-1 transition-all duration-300">
				<div class="flex justify-between items-start">
					<div class="p-3 rounded-2xl {stat.bg} {stat.color}">
						<stat.icon size={20} />
					</div>
					{#if stat.trend !== 0}
						<div class="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full {stat.trend > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}">
							{#if stat.trend > 0}
								<ArrowUpRight size={14} />
							{:else}
								<ArrowDownRight size={14} />
							{/if}
							{Math.abs(stat.trend)}%
						</div>
					{/if}
				</div>
				<div>
					<p class="text-sm text-text-secondary font-medium">{stat.label}</p>
					<p class="text-3xl font-display font-bold mt-1 group-hover:text-brand transition-colors">
						{stat.isCurrency ? formatCurrency(stat.value) : stat.value.toLocaleString()}
					</p>
				</div>
			</div>
		{/each}
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Main Chart Area (Liquid Glass Style) -->
		<div class="lg:col-span-2 glass-panel rounded-3xl flex flex-col h-[400px] overflow-hidden relative group">
			<div class="absolute inset-0 bg-gradient-to-tr from-brand/5 to-blue-500/5 opacity-50"></div>
			
			<div class="flex justify-between items-center p-6 relative z-10 border-b border-white/5">
				<div class="flex items-center gap-3">
					<div class="p-2 bg-white/5 rounded-xl text-text-primary">
						<Activity size={18} />
					</div>
					<h2 class="font-semibold">Revenue Stream</h2>
				</div>
				<select class="bg-white/5 border border-white/10 rounded-full text-xs font-medium px-3 py-1.5 outline-none hover:bg-white/10 transition-colors backdrop-blur-md">
					<option>Last 7 Days</option>
					<option>Last 30 Days</option>
					<option>Year to Date</option>
				</select>
			</div>
			
			<div class="flex-1 p-6 flex flex-col justify-end gap-2 relative z-10">
				<!-- Soft Glass Bar Chart -->
				<div class="absolute inset-x-6 inset-y-16 flex items-end justify-between px-2">
					{#each Array(7) as _, i}
						<div class="w-[10%] bg-gradient-to-t from-brand/40 to-brand/10 rounded-t-xl relative group/bar transition-all duration-700 ease-out hover:from-brand/60" style="height: {40 + Math.random() * 50}%">
							<div class="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-black/80 backdrop-blur-md text-xs py-1 px-2 rounded-lg pointer-events-none">
								${Math.floor(Math.random() * 5000 + 1000)}
							</div>
						</div>
					{/each}
				</div>
				<!-- Grid Lines -->
				<div class="absolute inset-x-6 inset-y-16 pointer-events-none flex flex-col justify-between border-l border-b border-white/10">
					{#each Array(4) as _, i}
						<div class="border-t border-white/5 w-full h-0 relative">
							<span class="absolute -left-8 -top-2 text-[10px] text-text-secondary/50 font-mono">{3 - i}k</span>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Event Log -->
		<div class="glass-strong rounded-3xl flex flex-col h-[400px]">
			<div class="flex justify-between items-center p-6 border-b border-white/5">
				<h2 class="font-semibold">System Events</h2>
				<button class="text-xs text-brand font-medium hover:text-brand-hover transition-colors">View All</button>
			</div>
			
			<div class="flex-1 overflow-y-auto p-4 space-y-2 hide-scrollbar">
				{#each recentActivity as event}
					<div class="p-3 rounded-2xl hover:bg-white/5 transition-colors flex items-start gap-3 cursor-pointer group">
						<div class="w-2 h-2 rounded-full mt-1.5 shrink-0 {getStatusColor(event.status)} shadow-[0_0_8px_currentColor]"></div>
						<div class="flex-1 min-w-0">
							<div class="flex justify-between items-baseline mb-0.5">
								<p class="text-sm font-semibold text-text-primary truncate">{event.restaurant}</p>
								<p class="text-[10px] text-text-secondary font-mono">{event.time}</p>
							</div>
							<p class="text-xs text-text-secondary group-hover:text-text-primary transition-colors">{event.action}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
