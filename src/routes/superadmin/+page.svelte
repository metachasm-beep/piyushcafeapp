<script lang="ts">
  import type { PageData } from './$types';
  import { TrendingUp, Users, ShoppingBag, Store, Activity, ChevronRight, Settings, Bell, Search, Plus } from 'lucide-svelte';
  import { formatCurrency } from '$lib/utils';
  import InteractiveRevenueChart from '$lib/components/InteractiveRevenueChart.svelte';
  import { slide, scale } from 'svelte/transition';

  import Card from '$lib/components/ui/card.svelte';
  import CardContent from '$lib/components/ui/card-content.svelte';

  let { data }: { data: PageData } = $props();

  let stats = $derived([
    { label: 'Total Revenue', value: data.stats.totalRevenue, isCurrency: true, color: 'bg-[#007AFF]', icon: TrendingUp },
    { label: 'Active Restaurants', value: data.stats.activeRestaurantsCount, isCurrency: false, color: 'bg-[#5856D6]', icon: Store },
    { label: 'Platform Fees', value: data.stats.platformFees, isCurrency: true, color: 'bg-[#34C759]', icon: Activity },
    { label: 'Total Orders', value: data.stats.totalOrdersToday, isCurrency: false, color: 'bg-[#FF9500]', icon: ShoppingBag },
  ]);

  let recentActivity = $state(data.recentActivity);
  let chartData = $derived(data.chartData.map(d => ({ date: new Date(d.date), revenue: d.revenue })));
  let amounts = $derived(chartData.map(d => d.revenue));

  function getStatusColor(status: string) {
    if (status === 'OK') return '#34C759'; // System Green
    if (status === 'WARN') return '#FFCC00'; // System Yellow
    return '#FF3B30'; // System Red
  }
</script>

<svelte:head>
  <title>Dashboard</title>
  <!-- Force Apple system fonts -->
  <style>
    :global(body) {
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
  </style>
</svelte:head>

<div class="min-h-screen bg-[#F2F2F7] text-black">
  
  <!-- iOS-style Navigation Bar -->
  <header class="sticky top-0 z-40 bg-[#F2F2F7]/80 backdrop-blur-[50px] border-b border-black/5 pb-2 pt-14">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 flex items-end justify-between">
      <div>
        <h1 class="text-[34px] font-bold tracking-tight leading-none text-black">Dashboard</h1>
      </div>
      <div class="flex items-center gap-4 pb-1">
        <button class="text-[#007AFF] hover:opacity-70 transition-opacity">
          <Search size={22} strokeWidth={2.5} />
        </button>
        <button class="text-[#007AFF] hover:opacity-70 transition-opacity">
          <Bell size={22} strokeWidth={2.5} />
        </button>
        <button class="text-[#007AFF] hover:opacity-70 transition-opacity">
          <Plus size={24} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  </header>

  <main class="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-20">
    
    <!-- Top Stats (iOS Widget Style) -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {#each stats as stat, i}
        <div in:scale={{ duration: 300, delay: i * 50, start: 0.9 }}>
          <Card class="h-full">
            <CardContent class="p-4 flex flex-col justify-between h-full">
              <div class="w-8 h-8 rounded-full {stat.color} flex items-center justify-center text-white mb-3">
                <stat.icon size={16} strokeWidth={2.5} />
              </div>
              <div>
                <p class="text-[13px] font-semibold text-black/50 uppercase tracking-wide">{stat.label}</p>
                <p class="text-[22px] font-bold tracking-tight text-black mt-0.5">
                  {stat.isCurrency ? formatCurrency(stat.value) : stat.value.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      {/each}
    </div>

    <!-- Revenue Chart (Inset Grouped Section) -->
    <div class="mb-8">
      <h2 class="text-[13px] font-semibold text-black/50 uppercase tracking-wide ml-4 mb-2">Revenue Trends</h2>
      <Card class="overflow-hidden">
        <div class="p-4 border-b border-black/5 flex justify-between items-center bg-white">
          <span class="text-[17px] font-semibold text-black">Monthly Overview</span>
          <span class="text-[17px] text-black/50">{formatCurrency(amounts.reduce((a: number, b: number) => a+b, 0))}</span>
        </div>
        <CardContent class="p-4 pt-6 bg-white h-[350px]">
          <InteractiveRevenueChart data={chartData} />
        </CardContent>
      </Card>
    </div>

    <!-- Activity Feed (Inset Grouped List) -->
    <div>
      <h2 class="text-[13px] font-semibold text-black/50 uppercase tracking-wide ml-4 mb-2">Recent Activity</h2>
      <div class="rounded-[18px] overflow-hidden bg-white shadow-sm">
        {#each recentActivity as event, i (event.id || event.time + event.restaurant)}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div 
            out:slide={{ duration: 250 }}
            class="flex items-center p-3 pl-4 active:bg-black/5 transition-colors cursor-pointer {i !== recentActivity.length - 1 ? 'border-b border-black/5' : ''}"
          >
            <!-- Status Dot -->
            <div class="w-2.5 h-2.5 rounded-full mr-4 shrink-0" style="background-color: {getStatusColor(event.status)};"></div>
            
            <div class="flex-1 min-w-0 pr-4">
              <p class="text-[17px] text-black font-normal truncate">{event.restaurant}</p>
              <p class="text-[15px] text-black/50 truncate mt-0.5">{event.action}</p>
            </div>

            <div class="flex items-center gap-3 shrink-0">
              <span class="text-[15px] text-black/50">{event.time}</span>
              <ChevronRight size={20} class="text-black/20" strokeWidth={2.5} />
            </div>
          </div>
        {/each}
      </div>
      <p class="text-[13px] text-black/50 text-center mt-4 mx-4">
        Showing all system activity for active network nodes.
      </p>
    </div>

  </main>
</div>
