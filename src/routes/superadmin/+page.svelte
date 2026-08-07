<script lang="ts">
  import type { PageData } from './$types';
  import { TrendingUp, Users, ShoppingBag, Store, Activity, ArrowUpRight } from 'lucide-svelte';
  import { formatCurrency } from '$lib/utils';
  import InteractiveRevenueChart from '$lib/components/InteractiveRevenueChart.svelte';

  import Card from '$lib/components/ui/card.svelte';
  import CardHeader from '$lib/components/ui/card-header.svelte';
  import CardContent from '$lib/components/ui/card-content.svelte';

  let { data }: { data: PageData } = $props();

  let stats = $derived([
    { label: 'Total Revenue', value: data.stats.totalRevenue, isCurrency: true, icon: TrendingUp, color: 'text-blue-500' },
    { label: 'Active Nodes', value: data.stats.activeRestaurantsCount, isCurrency: false, icon: Store, color: 'text-purple-500' },
    { label: 'Platform Fees', value: data.stats.platformFees, isCurrency: true, icon: ShoppingBag, color: 'text-emerald-500' },
    { label: 'Total Orders', value: data.stats.totalOrdersToday, isCurrency: false, icon: Activity, color: 'text-orange-500' },
  ]);

  let recentActivity = $state(data.recentActivity);
  let chartData = $derived(data.chartData.map(d => ({ date: new Date(d.date), revenue: d.revenue })));
  
  function getStatusColor(status: string) {
    if (status === 'OK') return '#34C759'; 
    if (status === 'WARN') return '#FFCC00';
    return '#FF3B30'; 
  }
</script>

<svelte:head>
  <title>Dashboard</title>
</svelte:head>

<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
  
  <!-- KPI Metrics (macOS style grouped cards) -->
  {#each stats as stat}
    <Card class="md:col-span-1">
      <CardContent class="p-4 flex items-center justify-between">
        <div>
          <p class="text-[12px] font-medium text-black/50 uppercase tracking-wide mb-0.5">{stat.label}</p>
          <p class="text-[22px] font-semibold tracking-tight text-black/90">
            {stat.isCurrency ? formatCurrency(stat.value) : stat.value.toLocaleString()}
          </p>
        </div>
        <div class="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center {stat.color}">
          <stat.icon size={16} strokeWidth={2.5} />
        </div>
      </CardContent>
    </Card>
  {/each}

  <!-- Chart Window -->
  <Card class="md:col-span-3">
    <CardHeader class="flex flex-row justify-between items-center bg-white/40">
      <h2 class="text-[13px] font-semibold text-black/70">Revenue Overview</h2>
      <select class="text-[12px] bg-black/5 border-none rounded-md px-2 py-1 text-black/70 outline-none">
        <option>Last 7 Days</option>
        <option>Last 30 Days</option>
      </select>
    </CardHeader>
    <CardContent class="p-0 h-[260px] relative">
      <InteractiveRevenueChart data={chartData} />
    </CardContent>
  </Card>

  <!-- Activity Window -->
  <Card class="md:col-span-1">
    <CardHeader class="bg-white/40">
      <h2 class="text-[13px] font-semibold text-black/70">Recent Activity</h2>
    </CardHeader>
    <div class="flex-1 overflow-y-auto px-2 py-2 h-[260px]">
      {#each recentActivity as event}
        <div class="flex items-center p-2 rounded-lg hover:bg-[#007AFF] hover:text-white group transition-colors cursor-pointer">
          <div class="w-2 h-2 rounded-full mr-2.5 shrink-0 transition-colors group-hover:bg-white" style="background-color: {getStatusColor(event.status)}"></div>
          <div class="flex-1 min-w-0 pr-1">
            <p class="text-[13px] font-medium text-black/90 group-hover:text-white truncate">{event.restaurant}</p>
            <p class="text-[11px] text-black/50 group-hover:text-white/80 truncate leading-tight mt-0.5">{event.action}</p>
          </div>
        </div>
      {/each}
      {#if recentActivity.length === 0}
        <div class="p-4 text-center text-sm text-black/40">No recent activity</div>
      {/if}
    </div>
  </Card>

</div>
