<script lang="ts">
  import type { PageData } from './$types';
  import { TrendingUp, Users, ShoppingBag, Store, Activity, Sparkles, ChevronRight } from 'lucide-svelte';
  import { formatCurrency } from '$lib/utils';
  import InteractiveRevenueChart from '$lib/components/InteractiveRevenueChart.svelte';

  import Card from '$lib/components/ui/card.svelte';
  import CardContent from '$lib/components/ui/card-content.svelte';

  let { data }: { data: PageData } = $props();

  let stats = $derived([
    { label: 'Total Revenue', value: data.stats.totalRevenue, isCurrency: true, color: 'text-indigo-400', icon: TrendingUp },
    { label: 'Active Nodes', value: data.stats.activeRestaurantsCount, isCurrency: false, color: 'text-purple-400', icon: Store },
    { label: 'Platform Fees', value: data.stats.platformFees, isCurrency: true, color: 'text-emerald-400', icon: Activity },
    { label: 'Total Orders', value: data.stats.totalOrdersToday, isCurrency: false, color: 'text-amber-400', icon: ShoppingBag },
  ]);

  let recentActivity = $state(data.recentActivity);
  let chartData = $derived(data.chartData.map(d => ({ date: new Date(d.date), revenue: d.revenue })));
  
  function getStatusColor(status: string) {
    if (status === 'OK') return 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]'; 
    if (status === 'WARN') return 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]';
    return 'bg-rose-400 shadow-[0_0_12px_rgba(251,113,133,0.8)]'; 
  }
</script>

<svelte:head>
  <title>Magic OS | Dashboard</title>
</svelte:head>

<div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-out">
  
  <!-- Magic Header -->
  <div class="flex items-end justify-between">
    <div>
      <h1 class="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-purple-200">
        System Overview
      </h1>
      <p class="text-white/50 mt-2 font-medium flex items-center gap-2">
        <Sparkles size={16} class="text-purple-400" />
        All nodes operating at optimal frequency.
      </p>
    </div>
  </div>

  <!-- Floating Stats -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {#each stats as stat, i}
      <div style="animation-delay: {i * 100}ms;" class="animate-in zoom-in-95 fade-in duration-700 ease-out">
        <Card variant="interactive" class="h-full">
          <CardContent class="p-6">
            <div class="flex justify-between items-start mb-4">
              <div class="p-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 {stat.color}">
                <stat.icon size={22} strokeWidth={2} />
              </div>
            </div>
            <div>
              <p class="text-[13px] font-semibold text-white/50 uppercase tracking-widest">{stat.label}</p>
              <p class="text-3xl font-bold text-white mt-1">
                {stat.isCurrency ? formatCurrency(stat.value) : stat.value.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    {/each}
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Chart Area -->
    <div class="lg:col-span-2">
      <Card class="h-[400px] flex flex-col">
        <div class="p-6 pb-2">
          <h2 class="text-lg font-bold text-white">Revenue Matrix</h2>
        </div>
        <CardContent class="flex-1 p-6 pt-0 relative z-20">
          <InteractiveRevenueChart data={chartData} />
        </CardContent>
      </Card>
    </div>

    <!-- Activity Stream -->
    <div class="lg:col-span-1">
      <Card class="h-[400px] flex flex-col">
        <div class="p-6 pb-4 border-b border-white/10">
          <h2 class="text-lg font-bold text-white">Activity Stream</h2>
        </div>
        <div class="flex-1 overflow-y-auto p-2">
          {#each recentActivity as event}
            <div class="group flex items-center p-4 rounded-[24px] hover:bg-white/10 transition-colors cursor-pointer mb-1">
              <div class="w-3 h-3 rounded-full mr-4 shrink-0 {getStatusColor(event.status)}"></div>
              <div class="flex-1 min-w-0 pr-4">
                <p class="text-[15px] font-semibold text-white truncate group-hover:text-indigo-200 transition-colors">{event.restaurant}</p>
                <p class="text-[13px] text-white/50 truncate mt-0.5">{event.action}</p>
              </div>
              <div class="flex flex-col items-end gap-1 shrink-0">
                <span class="text-[11px] text-white/40 uppercase tracking-wider">{event.time}</span>
                <ChevronRight size={16} class="text-white/20 group-hover:text-white/60 transition-colors group-hover:translate-x-1" />
              </div>
            </div>
          {/each}
        </div>
      </Card>
    </div>
  </div>

</div>
