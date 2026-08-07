<script lang="ts">
  import type { PageData } from './$types';
  import { TrendingUp, Users, ShoppingBag, Store, Activity, ArrowUpRight } from 'lucide-svelte';
  import { formatCurrency } from '$lib/utils';
  import InteractiveRevenueChart from '$lib/components/InteractiveRevenueChart.svelte';

  import Card from '$lib/components/ui/card.svelte';
  import CardContent from '$lib/components/ui/card-content.svelte';

  let { data }: { data: PageData } = $props();

  let stats = $derived([
    { label: 'Total Revenue', value: data.stats.totalRevenue, isCurrency: true, bg: 'bg-[#FF9500]', text: 'text-white' },
    { label: 'Active Nodes', value: data.stats.activeRestaurantsCount, isCurrency: false, bg: 'bg-[#007AFF]', text: 'text-white' },
    { label: 'Platform Fees', value: data.stats.platformFees, isCurrency: true, bg: 'bg-[#34C759]', text: 'text-white' },
    { label: 'Total Orders', value: data.stats.totalOrdersToday, isCurrency: false, bg: 'bg-black', text: 'text-white' },
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
  <title>Bento | Dashboard</title>
</svelte:head>

<!-- Bento Grid Container -->
<div class="grid grid-cols-1 md:grid-cols-4 md:auto-rows-[180px] gap-6 grid-flow-row-dense">
  
  <!-- Hero Tile (Spans 2 columns, 2 rows) -->
  <Card class="md:col-span-2 md:row-span-2 !bg-[#000000] text-white">
    <CardContent class="p-8 h-full flex flex-col justify-between">
      <div class="flex justify-between items-start">
        <h2 class="text-2xl font-bold tracking-tight">System Overview</h2>
        <div class="w-12 h-12 rounded-[16px] bg-white/10 flex items-center justify-center">
          <Activity size={24} />
        </div>
      </div>
      <div>
        <p class="text-white/50 text-[15px] font-medium uppercase tracking-widest mb-2">Network Health</p>
        <p class="text-[56px] font-bold tracking-tighter leading-none">Optimal</p>
      </div>
    </CardContent>
  </Card>

  <!-- Metric Tiles (1x1) -->
  {#each stats as stat}
    <Card class="md:col-span-1 md:row-span-1 {stat.bg} {stat.text}">
      <CardContent class="p-6 h-full flex flex-col justify-between">
        <div class="flex justify-end">
          <ArrowUpRight size={24} class="opacity-50" />
        </div>
        <div>
          <p class="opacity-70 text-[13px] font-semibold uppercase tracking-wider mb-1">{stat.label}</p>
          <p class="text-3xl font-bold tracking-tight leading-none">
            {stat.isCurrency ? formatCurrency(stat.value) : stat.value.toLocaleString()}
          </p>
        </div>
      </CardContent>
    </Card>
  {/each}

  <!-- Chart Tile (Spans 3 columns, 2 rows) -->
  <Card class="md:col-span-3 md:row-span-2">
    <div class="p-8 pb-0">
      <h2 class="text-[15px] font-semibold text-black/40 uppercase tracking-widest mb-1">Revenue Flow</h2>
      <p class="text-4xl font-bold tracking-tight text-black">
        {formatCurrency(chartData.reduce((a, b) => a + b.revenue, 0))}
      </p>
    </div>
    <!-- Edge to edge chart -->
    <CardContent class="p-0 absolute inset-0 top-[100px]">
      <InteractiveRevenueChart data={chartData} />
    </CardContent>
  </Card>

  <!-- Activity Tile (Spans 1 column, 2 rows) -->
  <Card class="md:col-span-1 md:row-span-2 bg-white">
    <div class="p-6 pb-2">
      <h2 class="text-[15px] font-semibold text-black/40 uppercase tracking-widest">Live Activity</h2>
    </div>
    <div class="flex-1 overflow-y-auto px-4 pb-4">
      {#each recentActivity as event}
        <div class="flex items-center p-3 rounded-[16px] hover:bg-black/5 transition-colors cursor-pointer">
          <div class="w-2.5 h-2.5 rounded-full mr-3 shrink-0" style="background-color: {getStatusColor(event.status)}"></div>
          <div class="flex-1 min-w-0 pr-2">
            <p class="text-[15px] font-semibold text-black truncate">{event.restaurant}</p>
            <p class="text-[13px] text-black/50 truncate leading-tight">{event.action}</p>
          </div>
        </div>
      {/each}
    </div>
  </Card>

</div>
