<script lang="ts">
	import { TrendingUp, Users, ShoppingBag, Store, ArrowUpRight, ArrowDownRight } from 'lucide-svelte';
	import { formatCurrency } from '$lib/utils';

	// Mock data for network-wide stats
	const stats = [
		{
			label: 'TOTAL REVENUE',
			value: 24589.50,
			isCurrency: true,
			trend: 12.5,
			icon: TrendingUp,
			color: 'text-green-500'
		},
		{
			label: 'ACTIVE RESTAURANTS',
			value: 12,
			isCurrency: false,
			trend: 0,
			icon: Store,
			color: 'text-brand'
		},
		{
			label: 'TOTAL ORDERS',
			value: 843,
			isCurrency: false,
			trend: 8.2,
			icon: ShoppingBag,
			color: 'text-blue-500'
		},
		{
			label: 'ACTIVE CUSTOMERS',
			value: 1245,
			isCurrency: false,
			trend: -2.4,
			icon: Users,
			color: 'text-red-500'
		}
	];

	const recentActivity = [
		{ id: 1, restaurant: 'DOWNTOWN BISTRO', action: 'NEW MENU ITEM ADDED', time: '10:42:00', status: 'OK' },
		{ id: 2, restaurant: 'WESTSIDE GRILL', action: 'HIGH VOLUME ALERT', time: '10:25:12', status: 'WARN' },
		{ id: 3, restaurant: 'NORTH BRANCH', action: 'PRINTER DISCONNECTED', time: '09:12:45', status: 'ERR' },
		{ id: 4, restaurant: 'EASTSIDE CAFE', action: 'DAILY REPORT GENERATED', time: '08:00:00', status: 'INFO' },
		{ id: 5, restaurant: 'MIDTOWN DINER', action: 'ORDER #8842 CANCELED', time: '07:45:11', status: 'WARN' },
		{ id: 6, restaurant: 'SOUTH STATION', action: 'SYSTEM BOOT', time: '06:30:00', status: 'OK' }
	];

	function getStatusColor(status: string) {
		switch (status) {
			case 'OK': return 'text-green-500';
			case 'WARN': return 'text-yellow-500';
			case 'ERR': return 'text-red-500';
			default: return 'text-blue-500';
		}
	}
</script>

<svelte:head>
	<title>NETWORK TERMINAL</title>
</svelte:head>

<div class="max-w-[1400px] mx-auto space-y-6 font-mono text-text-primary animate-fade-in">
	<header class="flex justify-between items-end border-b border-border pb-4">
		<div>
			<h1 class="text-2xl font-bold uppercase tracking-widest">Global Telemetry</h1>
			<p class="text-xs text-text-secondary mt-1 uppercase tracking-wide">Real-time metrics across all nodes</p>
		</div>
		<div class="flex gap-2">
			<button class="px-4 py-1 text-xs border border-border hover:bg-surface uppercase tracking-wide transition-colors">Export CSV</button>
			<button class="px-4 py-1 text-xs border border-brand text-brand hover:bg-brand hover:text-black uppercase tracking-wide transition-colors">New Node</button>
		</div>
	</header>

	<!-- Dense Stats Table -->
	<div class="border border-border">
		<div class="grid grid-cols-1 md:grid-cols-4 bg-surface border-b border-border text-xs uppercase tracking-widest text-text-secondary md:divide-x divide-y md:divide-y-0 divide-border">
			{#each stats as stat}
				<div class="p-2 hidden md:block">{stat.label}</div>
			{/each}
		</div>
		<div class="grid grid-cols-1 md:grid-cols-4 md:divide-x divide-y md:divide-y-0 divide-border">
			{#each stats as stat}
				<div class="p-4 flex flex-col justify-between h-24">
					<div class="text-xs text-text-secondary mb-2 md:hidden">{stat.label}</div>
					<div class="text-3xl font-bold {stat.color}">
						{stat.isCurrency ? formatCurrency(stat.value) : stat.value.toLocaleString()}
					</div>
					<div class="flex justify-between items-end">
						<stat.icon size={16} class="text-text-secondary" />
						{#if stat.trend !== 0}
							<div class="flex items-center gap-1 text-xs {stat.trend > 0 ? 'text-green-500' : 'text-red-500'}">
								{#if stat.trend > 0}
									<ArrowUpRight size={14} />
								{:else}
									<ArrowDownRight size={14} />
								{/if}
								{Math.abs(stat.trend)}%
							</div>
						{:else}
							<div class="text-xs text-text-secondary">--</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Main Chart Area (Terminal Style) -->
		<div class="lg:col-span-2 border border-border flex flex-col h-[400px]">
			<div class="flex justify-between items-center p-2 bg-surface border-b border-border">
				<h2 class="text-xs font-bold uppercase tracking-widest">Revenue Stream (7D)</h2>
				<select class="bg-transparent border border-border text-xs px-2 py-0.5 outline-none">
					<option>7 DAYS</option>
					<option>30 DAYS</option>
					<option>YTD</option>
				</select>
			</div>
			<div class="flex-1 p-4 flex flex-col justify-end gap-1 relative overflow-hidden">
				<!-- Mock Terminal Bar Chart -->
				<div class="absolute inset-0 flex items-end justify-around p-4 opacity-50">
					{#each Array(7) as _, i}
						<div class="w-8 md:w-12 bg-border relative flex items-end justify-center group" style="height: {30 + Math.random() * 60}%">
							<div class="absolute -top-6 text-[10px] text-text-secondary hidden group-hover:block opacity-100">${Math.floor(Math.random() * 5000 + 1000)}</div>
						</div>
					{/each}
				</div>
				<div class="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 border-l border-b border-border m-4">
					{#each Array(4) as _, i}
						<div class="border-t border-dashed border-border/30 w-full h-0 relative">
							<span class="absolute -left-10 -top-2 text-[10px] text-text-secondary/50">{3 - i}k</span>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Event Log -->
		<div class="border border-border flex flex-col h-[400px]">
			<div class="flex justify-between items-center p-2 bg-surface border-b border-border">
				<h2 class="text-xs font-bold uppercase tracking-widest">System Events</h2>
				<button class="text-[10px] text-brand hover:underline">TAIL -F</button>
			</div>
			
			<div class="flex-1 overflow-y-auto bg-black text-xs">
				<table class="w-full text-left border-collapse">
					<thead>
						<tr class="bg-surface/50 border-b border-border/50 text-[10px] text-text-secondary">
							<th class="p-2 font-normal w-16 hidden sm:table-cell">TIME</th>
							<th class="p-2 font-normal w-12">STAT</th>
							<th class="p-2 font-normal">NODE</th>
							<th class="p-2 font-normal">EVENT</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border/20">
						{#each recentActivity as activity}
							<tr class="hover:bg-surface/30">
								<td class="p-2 text-text-secondary/70 hidden sm:table-cell">{activity.time}</td>
								<td class="p-2 font-bold {getStatusColor(activity.status)}">{activity.status}</td>
								<td class="p-2 text-text-secondary truncate max-w-[80px]">{activity.restaurant}</td>
								<td class="p-2 truncate max-w-[120px]">{activity.action}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</div>
</div>
