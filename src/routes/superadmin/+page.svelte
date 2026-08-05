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

<div class="space-y-6 animate-fade-in pb-12 font-sans text-slate-900">
	<header class="flex flex-col md:flex-row md:justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-4">
		<div>
			<h1 class="text-2xl font-bold tracking-tight uppercase">Global Telemetry</h1>
			<p class="text-xs text-slate-500 mt-1 font-mono uppercase tracking-widest">Real-time metrics across all nodes</p>
		</div>
		<div class="flex gap-2">
			<button class="px-4 py-1.5 text-xs font-mono uppercase tracking-widest border border-slate-200 hover:bg-slate-50 transition-colors">Export Report</button>
			<button class="px-4 py-1.5 text-xs font-mono uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-700 transition-colors">New Node</button>
		</div>
	</header>

	<!-- Dense Stats Table -->
	<div class="border border-slate-200">
		<div class="grid grid-cols-1 md:grid-cols-4 bg-slate-50 border-b border-slate-200 text-[10px] font-mono uppercase tracking-widest text-slate-500 md:divide-x divide-y md:divide-y-0 divide-slate-200">
			{#each stats as stat}
				<div class="p-2 hidden md:block">{stat.label}</div>
			{/each}
		</div>
		<div class="grid grid-cols-1 md:grid-cols-4 md:divide-x divide-y md:divide-y-0 divide-slate-200 bg-white">
			{#each stats as stat}
				<div class="p-4 flex flex-col justify-between h-28 hover:bg-slate-50 transition-colors cursor-default">
					<div class="text-[10px] font-mono text-slate-500 mb-2 md:hidden uppercase">{stat.label}</div>
					<div class="text-3xl font-mono font-medium tracking-tight {stat.color}">
						{stat.isCurrency ? formatCurrency(stat.value) : stat.value.toLocaleString()}
					</div>
					<div class="flex justify-between items-end mt-2">
						<stat.icon size={16} class="text-slate-400" />
						{#if stat.trend !== 0}
							<div class="flex items-center gap-1 text-[11px] font-mono font-semibold {stat.trendColor}">
								{#if stat.trend > 0}
									<ArrowUpRight size={14} />
								{:else}
									<ArrowDownRight size={14} />
								{/if}
								{Math.abs(stat.trend)}%
							</div>
						{:else}
							<div class="text-[11px] font-mono text-slate-400">--</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Main Chart Area (Clinical Style) -->
		<div class="lg:col-span-2 border border-slate-200 flex flex-col h-[400px] bg-white">
			<div class="flex justify-between items-center p-3 bg-slate-50 border-b border-slate-200">
				<div class="flex items-center gap-2">
					<Activity size={14} class="text-slate-500" />
					<h2 class="text-xs font-bold font-mono uppercase tracking-widest">Revenue Stream (7D)</h2>
				</div>
				<select class="bg-white border border-slate-200 text-[10px] font-mono uppercase tracking-widest px-2 py-1 outline-none focus:border-blue-500">
					<option>7 DAYS</option>
					<option>30 DAYS</option>
					<option>YTD</option>
				</select>
			</div>
			<div class="flex-1 p-6 flex flex-col justify-end gap-1 relative overflow-hidden">
				<!-- Minimalist Bar Chart -->
				<div class="absolute inset-x-6 inset-y-8 flex items-end justify-between">
					{#each Array(7) as _, i}
						<div class="w-12 bg-slate-100 hover:bg-slate-200 border-t-2 border-blue-600 relative group transition-colors" style="height: {30 + Math.random() * 60}%">
							<div class="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-[10px] font-mono font-medium text-slate-900 bg-white border border-slate-200 px-1 py-0.5 pointer-events-none">
								${Math.floor(Math.random() * 5000 + 1000)}
							</div>
						</div>
					{/each}
				</div>
				<div class="absolute inset-x-6 inset-y-8 pointer-events-none flex flex-col justify-between border-l border-b border-slate-200">
					{#each Array(4) as _, i}
						<div class="border-t border-dashed border-slate-200 w-full h-0 relative">
							<span class="absolute -left-8 -top-2 text-[10px] font-mono text-slate-400 bg-white pr-1">{3 - i}k</span>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Event Log -->
		<div class="border border-slate-200 flex flex-col h-[400px] bg-white">
			<div class="flex justify-between items-center p-3 bg-slate-50 border-b border-slate-200">
				<h2 class="text-xs font-bold font-mono uppercase tracking-widest">System Events</h2>
				<button class="text-[10px] font-mono uppercase tracking-widest text-blue-600 hover:underline">Tail -f</button>
			</div>
			
			<div class="flex-1 overflow-y-auto">
				<table class="w-full text-left border-collapse">
					<thead>
						<tr class="border-b border-slate-200 text-[10px] font-mono text-slate-500 uppercase tracking-widest bg-slate-50/50">
							<th class="p-2 font-normal">Time</th>
							<th class="p-2 font-normal">Node</th>
							<th class="p-2 font-normal">Event</th>
						</tr>
					</thead>
					<tbody class="text-xs divide-y divide-slate-100 font-mono">
						{#each recentActivity as event}
							<tr class="hover:bg-slate-50 transition-colors">
								<td class="p-2 text-slate-400 w-20">{event.time}</td>
								<td class="p-2 truncate max-w-[100px] font-medium" title={event.restaurant}>{event.restaurant}</td>
								<td class="p-2 truncate max-w-[120px] {getStatusColor(event.status)}" title={event.action}>{event.action}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</div>
</div>
