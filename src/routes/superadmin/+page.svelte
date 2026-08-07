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
    { label: 'Revenue', value: data.stats.totalRevenue, isCurrency: true },
    { label: 'Restaurants', value: data.stats.activeRestaurantsCount, isCurrency: false },
    { label: 'Fees', value: data.stats.platformFees, isCurrency: true },
    { label: 'Orders', value: data.stats.totalOrdersToday, isCurrency: false },
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
  <title>Store Dashboard</title>
</svelte:head>

<div class="mb-16 mt-8">
  <h1 class="text-5xl lg:text-7xl font-bold tracking-tight text-[#1D1D1F] mb-4">
    Store Overview.
  </h1>
  <p class="text-xl lg:text-3xl text-[#1D1D1F]/50 font-medium tracking-tight">
    Your retail performance at a glance.
  </p>
</div>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
  <!-- Minimalist KPI Metrics -->
  {#each stats as stat}
    <Card class="col-span-1 border-none shadow-none bg-[#F5F5F7] hover:scale-[1.02] transition-transform duration-500 ease-out">
      <CardContent class="p-8 flex flex-col justify-end min-h-[200px]">
        <p class="text-[17px] font-semibold text-[#1D1D1F]/50 tracking-tight mb-2">{stat.label}</p>
        <p class="text-4xl lg:text-5xl font-bold tracking-tight text-[#1D1D1F]">
          {stat.isCurrency ? formatCurrency(stat.value) : stat.value.toLocaleString()}
        </p>
      </CardContent>
    </Card>
  {/each}
</div>

<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
  <!-- Chart Area -->
  <Card class="lg:col-span-2 border-none shadow-none bg-[#F5F5F7]">
    <CardHeader class="flex flex-row justify-between items-end pb-0">
      <h2 class="text-2xl font-bold text-[#1D1D1F] tracking-tight">Performance</h2>
      <button class="text-[15px] font-semibold text-[#0066CC] hover:underline tracking-tight">
        View All
      </button>
    </CardHeader>
    <CardContent class="p-8 h-[400px]">
      <InteractiveRevenueChart data={chartData} />
    </CardContent>
  </Card>

  <!-- Activity Area -->
  <Card class="lg:col-span-1 border-none shadow-none bg-[#F5F5F7]">
    <CardHeader class="pb-4">
      <h2 class="text-2xl font-bold text-[#1D1D1F] tracking-tight">Activity</h2>
    </CardHeader>
    <div class="flex-1 overflow-y-auto px-8 py-0 h-[360px]">
      <div class="flex flex-col gap-6">
        {#each recentActivity as event}
          <div class="flex items-start gap-4 group cursor-pointer">
            <div class="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style="background-color: {getStatusColor(event.status)}"></div>
            <div>
              <p class="text-[17px] font-semibold text-[#1D1D1F] group-hover:text-[#0066CC] transition-colors tracking-tight">{event.restaurant}</p>
              <p class="text-[15px] text-[#1D1D1F]/50 mt-1 leading-snug">{event.action}</p>
            </div>
          </div>
        {/each}
        {#if recentActivity.length === 0}
          <div class="text-[15px] text-[#1D1D1F]/40 font-medium">No recent activity</div>
        {/if}
      </div>
    </div>
  </Card>
</div>
