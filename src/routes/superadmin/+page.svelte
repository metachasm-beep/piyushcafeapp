<script lang="ts">
  import type { PageData } from './$types';
  import { TrendingUp, Users, ShoppingBag, Store, Activity, AlertTriangle } from 'lucide-svelte';
  import { formatCurrency } from '$lib/utils';
  import InteractiveRevenueChart from '$lib/components/InteractiveRevenueChart.svelte';

  import Card from '$lib/components/ui/card.svelte';
  import CardHeader from '$lib/components/ui/card-header.svelte';
  import CardTitle from '$lib/components/ui/card-title.svelte';
  import CardContent from '$lib/components/ui/card-content.svelte';

  let { data }: { data: PageData } = $props();

  let stats = $derived([
    { id: 'REV_TOT', label: 'Total Revenue', value: data.stats.totalRevenue, isCurrency: true, trend: 12.5 },
    { id: 'RST_ACT', label: 'Active Nodes', value: data.stats.activeRestaurantsCount, isCurrency: false, trend: 0 },
    { id: 'FEE_PLT', label: 'Platform Fees', value: data.stats.platformFees, isCurrency: true, trend: 8.2 },
    { id: 'ORD_TOT', label: 'Tx Volume', value: data.stats.totalOrdersToday, isCurrency: false, trend: -3.1 },
  ]);

  let recentActivity = $state(data.recentActivity);
  let chartData = $derived(data.chartData.map(d => ({ date: new Date(d.date), revenue: d.revenue })));
  let amounts = $derived(chartData.map(d => d.revenue));

  function getStatusClass(status: string) {
    if (status === 'OK') return 'text-slate-500'; // Muted for OK
    if (status === 'WARN') return 'text-amber-600 bg-amber-50 font-bold'; 
    return 'text-red-600 bg-red-50 font-bold'; // Highlight anomalies
  }
</script>

<svelte:head>
  <title>SUPERADMIN | T-SYSTEM</title>
  <style>
    :global(body) {
      font-family: 'Inter', system-ui, sans-serif;
      background-color: #e2e8f0; /* slate-200 */
    }
  </style>
</svelte:head>

<div class="min-h-screen text-[11px] text-slate-800 flex flex-col h-screen overflow-hidden">
  
  <!-- Utilitarian Data Header -->
  <header class="bg-slate-900 text-slate-300 border-b border-slate-950 flex-none">
    <div class="px-2 py-1 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <span class="font-mono text-white font-bold tracking-tight">SYS_SUPERADMIN</span>
        <div class="flex gap-3 font-mono">
          <span>ENV: <span class="text-emerald-400">PROD</span></span>
          <span>UPTIME: 99.99%</span>
          <span>LAT: 12ms</span>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <span class="font-mono">{new Date().toISOString()}</span>
      </div>
    </div>
  </header>

  <!-- High-Density Main Layout -->
  <main class="flex-1 overflow-auto p-1 flex flex-col gap-1">
    
    <!-- KPI Data Grid -->
    <div class="grid grid-cols-4 gap-1">
      {#each stats as stat}
        <Card>
          <CardHeader class="py-1 px-2 border-b border-slate-300 bg-slate-100 flex flex-row items-center justify-between">
            <span class="font-mono font-bold text-slate-600 tracking-tight">{stat.id}</span>
            <span class="text-[10px] text-slate-500 uppercase">{stat.label}</span>
          </CardHeader>
          <CardContent class="py-2 px-2 flex items-baseline justify-between">
            <span class="text-lg font-bold font-mono tracking-tighter text-slate-900">
              {stat.isCurrency ? formatCurrency(stat.value) : stat.value.toLocaleString()}
            </span>
            <span class="font-mono {stat.trend > 0 ? 'text-slate-600' : stat.trend < 0 ? 'text-red-600 font-bold' : 'text-slate-400'}">
              {stat.trend > 0 ? '+' : ''}{stat.trend}%
            </span>
          </CardContent>
        </Card>
      {/each}
    </div>

    <!-- Telemetry & Logs Split -->
    <div class="grid grid-cols-12 gap-1 flex-1 min-h-[500px]">
      
      <!-- Chart Area -->
      <div class="col-span-8 flex flex-col h-full gap-1">
        <Card class="flex-1 flex flex-col">
          <CardHeader class="py-1 px-2 flex flex-row justify-between items-center bg-slate-100">
            <span class="font-bold font-mono text-slate-600">REVENUE_TELEMETRY</span>
            <div class="flex gap-2">
              <span class="px-1 border border-slate-300 bg-white cursor-pointer hover:bg-slate-50">1D</span>
              <span class="px-1 border border-slate-300 bg-white cursor-pointer hover:bg-slate-50">1W</span>
              <span class="px-1 border border-slate-400 bg-slate-200 cursor-pointer font-bold">1M</span>
              <span class="px-1 border border-slate-300 bg-white cursor-pointer hover:bg-slate-50">YTD</span>
            </div>
          </CardHeader>
          <CardContent class="flex-1 p-0 relative bg-white">
            <InteractiveRevenueChart data={chartData} />
          </CardContent>
        </Card>
      </div>

      <!-- Activity Feed Data Table -->
      <div class="col-span-4 flex flex-col h-full gap-1">
        <Card class="flex-1 flex flex-col overflow-hidden">
          <CardHeader class="py-1 px-2 flex flex-row justify-between items-center bg-slate-100">
            <span class="font-bold font-mono text-slate-600">SYSTEM_LOGS</span>
            <span class="font-mono text-slate-500">ROWS: {recentActivity.length}</span>
          </CardHeader>
          <div class="flex-1 overflow-y-auto bg-white">
            <table class="w-full text-left border-collapse">
              <thead class="sticky top-0 bg-slate-50 border-b border-slate-300 shadow-sm z-10">
                <tr>
                  <th class="py-1 px-2 font-mono text-slate-500 font-normal w-12 border-r border-slate-200">STAT</th>
                  <th class="py-1 px-2 font-mono text-slate-500 font-normal border-r border-slate-200">NODE</th>
                  <th class="py-1 px-2 font-mono text-slate-500 font-normal w-16 border-r border-slate-200">TIME</th>
                  <th class="py-1 px-2 font-mono text-slate-500 font-normal">EVENT</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-mono">
                {#each recentActivity as event}
                  <tr class="hover:bg-slate-50 {getStatusClass(event.status)}">
                    <td class="py-1 px-2 border-r border-slate-200 text-center">
                      {#if event.status !== 'OK'}
                        <AlertTriangle size={12} class="inline" />
                      {:else}
                        {event.status}
                      {/if}
                    </td>
                    <td class="py-1 px-2 border-r border-slate-200 truncate max-w-[80px]" title={event.restaurant}>
                      {event.restaurant.substring(0, 10)}
                    </td>
                    <td class="py-1 px-2 border-r border-slate-200 whitespace-nowrap">
                      {event.time.replace('ago', '')}
                    </td>
                    <td class="py-1 px-2 truncate max-w-[120px]" title={event.action}>
                      {event.action}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

    </div>
  </main>
</div>
