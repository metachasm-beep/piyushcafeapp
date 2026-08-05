<script lang="ts">
	import { TrendingUp, Users, ShoppingBag, Store, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-svelte';
	import { formatCurrency } from '$lib/utils';

	// Mock data for network-wide stats
	const stats = [
		{
			label: 'Total Revenue Today',
			value: 24589.50,
			isCurrency: true,
			trend: 12.5,
			icon: TrendingUp,
			color: 'text-green-500',
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
			color: 'text-blue-500',
			bg: 'bg-blue-500/10'
		},
		{
			label: 'Active Customers',
			value: 1245,
			isCurrency: false,
			trend: -2.4,
			icon: Users,
			color: 'text-purple-500',
			bg: 'bg-purple-500/10'
		}
	];

	const recentActivity = [
		{ id: 1, restaurant: 'Downtown Bistro', action: 'New menu item added', time: '10 mins ago', status: 'success' },
		{ id: 2, restaurant: 'Westside Grill', action: 'High volume alert', time: '25 mins ago', status: 'warning' },
		{ id: 3, restaurant: 'North Branch', action: 'Printer disconnected', time: '1 hour ago', status: 'error' },
		{ id: 4, restaurant: 'Eastside Cafe', action: 'Daily report generated', time: '2 hours ago', status: 'info' }
	];

	function getStatusColor(status: string) {
		switch (status) {
			case 'success': return 'text-green-400 bg-green-400/10';
			case 'warning': return 'text-yellow-400 bg-yellow-400/10';
			case 'error': return 'text-red-400 bg-red-400/10';
			default: return 'text-blue-400 bg-blue-400/10';
		}
	}
</script>

<svelte:head>
	<title>Network Dashboard | Superadmin</title>
</svelte:head>

<div class="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
	<header class="flex justify-between items-end">
		<div>
			<h1 class="text-3xl font-display font-bold text-text-primary">Network Overview</h1>
			<p class="text-text-secondary mt-2">Real-time metrics across all locations</p>
		</div>
		<div class="flex gap-3">
			<button class="btn-ghost">Download Report</button>
			<button class="btn-brand">Add Restaurant</button>
		</div>
	</header>

	<!-- Stats Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
		{#each stats as stat}
			<div class="glass p-6 rounded-2xl flex flex-col gap-4 relative overflow-hidden group hover:border-brand/30 transition-colors">
				<div class="flex justify-between items-start">
					<div class="p-3 rounded-xl {stat.bg} {stat.color}">
						<stat.icon size={24} />
					</div>
					{#if stat.trend !== 0}
						<div class="flex items-center gap-1 text-sm font-medium {stat.trend > 0 ? 'text-green-400' : 'text-red-400'}">
							{#if stat.trend > 0}
								<ArrowUpRight size={16} />
							{:else}
								<ArrowDownRight size={16} />
							{/if}
							{Math.abs(stat.trend)}%
						</div>
					{:else}
						<div class="text-sm text-text-secondary font-medium px-2 py-1 bg-surface rounded-md">
							Stable
						</div>
					{/if}
				</div>
				
				<div>
					<div class="text-3xl font-bold text-text-primary mb-1">
						{stat.isCurrency ? formatCurrency(stat.value) : stat.value.toLocaleString()}
					</div>
					<div class="text-sm text-text-secondary">{stat.label}</div>
				</div>
				
				<!-- Decorative background glow -->
				<div class="absolute -bottom-10 -right-10 w-32 h-32 {stat.bg} rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
			</div>
		{/each}
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
		<!-- Main Chart Area (Placeholder) -->
		<div class="lg:col-span-2 glass rounded-2xl p-6 h-[400px] flex flex-col">
			<div class="flex justify-between items-center mb-6">
				<h2 class="text-xl font-bold font-display">Revenue Overview</h2>
				<select class="input-dark py-1 px-3 text-sm">
					<option>Today</option>
					<option>This Week</option>
					<option>This Month</option>
				</select>
			</div>
			<div class="flex-1 flex items-center justify-center border border-dashed border-border rounded-xl bg-surface/50">
				<div class="text-center text-text-secondary">
					<Activity size={48} class="mx-auto mb-4 opacity-50" />
					<p>Chart visualization goes here</p>
				</div>
			</div>
		</div>

		<!-- Recent Activity -->
		<div class="glass rounded-2xl p-6 flex flex-col">
			<div class="flex justify-between items-center mb-6">
				<h2 class="text-xl font-bold font-display">Recent Activity</h2>
				<button class="text-sm text-brand hover:underline">View All</button>
			</div>
			
			<div class="flex-1 overflow-y-auto pr-2 space-y-4">
				{#each recentActivity as activity}
					<div class="flex gap-4 items-start p-3 rounded-xl hover:bg-surface/50 transition-colors">
						<div class="mt-1 w-2 h-2 rounded-full {getStatusColor(activity.status).split(' ')[0]} bg-current shadow-[0_0_8px_currentColor]"></div>
						<div class="flex-1">
							<div class="font-medium text-text-primary">{activity.restaurant}</div>
							<div class="text-sm text-text-secondary mt-0.5">{activity.action}</div>
							<div class="text-xs text-text-secondary/60 mt-1">{activity.time}</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
