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
			color: 'text-slate-900',
			trendColor: 'text-blue-600'
		},
		{
			label: 'Active Restaurants',
			value: 12,
			isCurrency: false,
			trend: 0,
			icon: Store,
			color: 'text-slate-900',
			trendColor: 'text-slate-500'
		},
		{
			label: 'Total Orders',
			value: 843,
			isCurrency: false,
			trend: 8.2,
			icon: ShoppingBag,
			color: 'text-slate-900',
			trendColor: 'text-blue-600'
		},
		{
			label: 'Active Customers',
			value: 1245,
			isCurrency: false,
			trend: -2.4,
			icon: Users,
			color: 'text-slate-900',
			trendColor: 'text-red-600'
		}
	];

	const recentActivity = [
		{ id: 1, restaurant: 'Downtown Bistro', action: 'New menu item added', time: '10:42:00', status: 'OK' },
		{ id: 2, restaurant: 'Westside Grill', action: 'High volume alert', time: '10:25:12', status: 'WARN' },
		{ id: 3, restaurant: 'North Branch', action: 'Printer disconnected', time: '09:12:45', status: 'ERR' },
		{ id: 4, restaurant: 'Eastside Cafe', action: 'Daily report generated', time: '08:00:00', status: 'INFO' },
		{ id: 5, restaurant: 'Midtown Diner', action: 'Order #8842 canceled', time: '07:45:11', status: 'WARN' },
		{ id: 6, restaurant: 'South Station', action: 'System boot', time: '06:30:00', status: 'OK' }
	];

	function getStatusColor(status: string) {
		switch (status) {
			case 'OK': return 'text-slate-900';
			case 'WARN': return 'text-amber-600';
			case 'ERR': return 'text-red-600';
			default: return 'text-blue-600';
		}
	}
</script>

<svelte:head>
	<title>Global Telemetry</title>
</svelte:head>

<div class="space-y-16 animate-fade-in pb-16 font-sans text-slate-900">
	<!-- Editorial Header -->
	<header class="border-b-2 border-slate-900 pb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-6">
		<div class="max-w-2xl">
			<h1 class="text-5xl md:text-7xl font-display font-black tracking-tighter leading-none italic pr-4">Global<br />Telemetry.</h1>
			<p class="text-sm text-slate-500 mt-6 font-mono uppercase tracking-widest leading-relaxed">
				Real-time performance metrics and system events across the entire restaurant network.
			</p>
		</div>
		<div class="flex gap-4 border-l border-slate-200 pl-6 shrink-0">
			<button class="text-xs font-mono uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors" onclick={() => { import('svelte-sonner').then(m => m.toast.success('Report exported to CSV')) }}>[ Export Report ]</button>
			<button class="text-xs font-mono uppercase tracking-widest text-emerald-600 hover:text-emerald-500 transition-colors" onclick={() => { import('$app/navigation').then(m => m.goto('/superadmin/restaurants')) }}>[ Provision Node ]</button>
		</div>
	</header>

	<!-- Asymmetric Stats Ledger -->
	<div class="grid grid-cols-1 md:grid-cols-12 gap-12 border-b border-slate-200 pb-16">
		<div class="md:col-span-3">
			<h2 class="font-display text-2xl font-bold italic text-slate-400">Key<br/>Indicators</h2>
		</div>
		<div class="md:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-16">
			{#each stats as stat}
				<div class="flex flex-col group relative">
					<div class="flex justify-between items-baseline border-b border-slate-200 pb-2 mb-4 group-hover:border-slate-900 transition-colors">
						<span class="text-[10px] font-mono uppercase tracking-widest text-slate-500">{stat.label}</span>
						<stat.icon size={14} class="text-slate-300 group-hover:text-slate-900 transition-colors" />
					</div>
					<div class="text-5xl font-mono font-medium tracking-tight text-slate-900">
						{stat.isCurrency ? formatCurrency(stat.value) : stat.value.toLocaleString()}
					</div>
					{#if stat.trend !== 0}
						<div class="mt-4 flex items-center gap-2 text-xs font-mono font-semibold {stat.trendColor === 'text-blue-600' ? 'text-emerald-600' : stat.trendColor}">
							{#if stat.trend > 0}
								<ArrowUpRight size={14} />
							{:else}
								<ArrowDownRight size={14} />
							{/if}
							{Math.abs(stat.trend)}% vs last month
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>

	<!-- Bottom Section: Chart & Logs -->
	<div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
		
		<!-- Revenue Stream -->
		<div class="lg:col-span-8 flex flex-col gap-6">
			<div class="flex justify-between items-end border-b border-slate-200 pb-4">
				<h2 class="font-display text-3xl font-bold italic">Revenue Stream</h2>
				<span class="text-[10px] font-mono uppercase tracking-widest text-slate-400">Past 7 Days</span>
			</div>
			<div class="h-64 flex items-end gap-2 relative">
				<!-- Editorial Chart (just bars, no background) -->
				<div class="absolute inset-0 flex flex-col justify-between pointer-events-none">
					{#each Array(4) as _, i}
						<div class="w-full h-px bg-slate-200/50"></div>
					{/each}
				</div>
				{#each Array(7) as _, i}
					<div class="flex-1 bg-slate-200 hover:bg-emerald-600 transition-colors relative group z-10" style="height: {30 + Math.random() * 60}%">
						<div class="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-[10px] font-mono font-medium text-emerald-700 pointer-events-none transition-opacity">
							${Math.floor(Math.random() * 5000 + 1000)}
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Event Log -->
		<div class="lg:col-span-4 flex flex-col gap-6">
			<div class="flex justify-between items-end border-b border-slate-200 pb-4">
				<h2 class="font-display text-2xl font-bold italic">System Log</h2>
				<button class="text-[10px] font-mono uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors" onclick={() => { import('svelte-sonner').then(m => m.toast.success('Log stream attached')) }}>[ Tail -f ]</button>
			</div>
			
			<div class="flex-1 bg-slate-900 text-slate-300 p-6 rounded-none font-mono text-[10px] sm:text-xs overflow-y-auto max-h-80 shadow-2xl">
				<div class="space-y-3">
					{#each recentActivity as event}
						<div class="flex gap-4">
							<span class="text-slate-500 w-16 shrink-0">{event.time}</span>
							<div class="flex flex-col gap-1">
								<span class="font-bold text-slate-100">{event.restaurant}</span>
								<span class="{event.status === 'ERR' ? 'text-red-400' : event.status === 'WARN' ? 'text-amber-400' : 'text-emerald-400'}">
									> {event.action} [{event.status}]
								</span>
							</div>
						</div>
					{/each}
					<div class="flex gap-4 animate-pulse">
						<span class="text-slate-500 w-16 shrink-0">Now</span>
						<span class="text-slate-100">_</span>
					</div>
				</div>
			</div>
		</div>

	</div>
</div>
