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
    { label: 'Revenue', value: data.stats.totalRevenue, isCurrency: true, icon: TrendingUp },
    { label: 'Restaurants', value: data.stats.activeRestaurantsCount, isCurrency: false, icon: Store },
    { label: 'Fees', value: data.stats.platformFees, isCurrency: true, icon: ShoppingBag },
    { label: 'Orders', value: data.stats.totalOrdersToday, isCurrency: false, icon: Activity },
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
  <title>Spatial Dashboard</title>
</svelte:head>

<div class="mb-10 mt-6 lg:mt-2">
  <h1 class="text-4xl lg:text-5xl font-bold tracking-tight text-white mb-2 drop-shadow-lg">
    Overview
  </h1>
  <p class="text-lg text-white/60 font-medium tracking-wide">
    Your global platform metrics in real-time.
  </p>
</div>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
  <!-- Volumetric Glass KPI Metrics -->
  {#each stats as stat}
    <Card variant="interactive" class="col-span-1">
      <CardContent class="p-6 flex flex-col justify-between min-h-[160px]">
        <div class="flex justify-between items-start">
          <p class="text-[15px] font-semibold text-white/60 tracking-wider uppercase">{stat.label}</p>
          <div class="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
            <stat.icon size={18} class="text-white drop-shadow-md" />
          </div>
        </div>
        <p class="text-3xl lg:text-4xl font-bold tracking-tight text-white drop-shadow-md mt-4">
          {stat.isCurrency ? formatCurrency(stat.value) : stat.value.toLocaleString()}
        </p>
      </CardContent>
    </Card>
  {/each}
</div>

<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <!-- Glass Chart Area -->
  <Card class="lg:col-span-2">
    <CardHeader class="flex flex-row justify-between items-center">
      <h2 class="text-xl font-bold text-white tracking-tight drop-shadow-md">Performance</h2>
      <select class="text-[13px] bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white outline-none focus:bg-white/20 transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
        <option class="text-black">Last 7 Days</option>
        <option class="text-black">Last 30 Days</option>
      </select>
    </CardHeader>
    <CardContent class="p-6 h-[380px]">
      <InteractiveRevenueChart data={chartData} />
    </CardContent>
  </Card>

  <!-- Glass Activity Area -->
  <Card class="lg:col-span-1">
    <CardHeader>
      <h2 class="text-xl font-bold text-white tracking-tight drop-shadow-md">Activity</h2>
    </CardHeader>
    <div class="flex-1 overflow-y-auto px-6 py-2 h-[340px]">
      <div class="flex flex-col gap-4">
        {#each recentActivity as event}
          <div class="flex items-center gap-4 group cursor-pointer p-3 rounded-2xl hover:bg-white/10 transition-all duration-300">
            <div class="w-2.5 h-2.5 rounded-full shrink-0 shadow-[0_0_10px_rgba(255,255,255,0.5)]" style="background-color: {getStatusColor(event.status)}"></div>
            <div class="flex-1 min-w-0">
              <p class="text-[15px] font-medium text-white group-hover:text-white transition-colors tracking-tight truncate drop-shadow-sm">{event.restaurant}</p>
              <p class="text-[13px] text-white/50 group-hover:text-white/70 mt-0.5 leading-snug truncate">{event.action}</p>
            </div>
          </div>
        {/each}
        {#if recentActivity.length === 0}
          <div class="text-[14px] text-white/40 font-medium text-center mt-8">No recent activity</div>
        {/if}
      </div>
    </div>
  </Card>
</div>
