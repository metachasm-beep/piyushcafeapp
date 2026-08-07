<script lang="ts">
  import type { PageData } from './$types';
  import { TrendingUp, Users, ShoppingBag, Store, Activity, DollarSign, CreditCard } from 'lucide-svelte';
  import { formatCurrency } from '$lib/utils';
  import InteractiveRevenueChart from '$lib/components/InteractiveRevenueChart.svelte';

  import Card from '$lib/components/ui/card.svelte';
  import CardHeader from '$lib/components/ui/card-header.svelte';
  import CardContent from '$lib/components/ui/card-content.svelte';

  let { data }: { data: PageData } = $props();

  let stats = $derived([
    { label: 'Total Revenue', value: data.stats.totalRevenue, isCurrency: true, icon: DollarSign, subtext: '+20.1% from last month' },
    { label: 'Active Restaurants', value: data.stats.activeRestaurantsCount, isCurrency: false, icon: Store, subtext: '+4 since last week' },
    { label: 'Platform Fees', value: data.stats.platformFees, isCurrency: true, icon: CreditCard, subtext: '+19% from last month' },
    { label: 'Total Orders', value: data.stats.totalOrdersToday, isCurrency: false, icon: Activity, subtext: '+201 since last hour' },
  ]);

  let recentActivity = $state(data.recentActivity);
  let chartData = $derived(data.chartData.map(d => ({ date: new Date(d.date), revenue: d.revenue })));
</script>

<svelte:head>
  <title>Dashboard</title>
</svelte:head>

<div class="flex-1 space-y-4">
  <div class="flex items-center justify-between space-y-2 mb-8">
    <h2 class="text-3xl font-bold tracking-tight">Dashboard</h2>
    <div class="flex items-center space-x-2">
      <button class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 bg-zinc-900 text-zinc-50 shadow hover:bg-zinc-900/90 h-9 px-4 py-2">
        Download Report
      </button>
    </div>
  </div>
  
  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    {#each stats as stat}
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 class="tracking-tight text-sm font-medium">{stat.label}</h3>
          <stat.icon size={16} class="text-zinc-900" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-zinc-950">
            {stat.isCurrency ? formatCurrency(stat.value) : stat.value.toLocaleString()}
          </div>
          <p class="text-xs text-zinc-900 mt-1">
            {stat.subtext}
          </p>
        </CardContent>
      </Card>
    {/each}
  </div>

  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-7 pt-4">
    <!-- Chart Area -->
    <Card class="col-span-4">
      <CardHeader>
        <h3 class="font-semibold leading-none tracking-tight">Overview</h3>
      </CardHeader>
      <CardContent class="pl-2 h-[350px]">
        <InteractiveRevenueChart data={chartData} />
      </CardContent>
    </Card>

    <!-- Activity Area -->
    <Card class="col-span-3">
      <CardHeader>
        <h3 class="font-semibold leading-none tracking-tight">Recent Activity</h3>
        <p class="text-sm text-zinc-900">
          There were {recentActivity.length} recent events across the platform.
        </p>
      </CardHeader>
      <CardContent class="h-[350px] overflow-y-auto">
        <div class="space-y-8">
          {#each recentActivity as event}
            <div class="flex items-center">
              <div class="ml-4 space-y-1">
                <p class="text-sm font-medium leading-none text-zinc-950">{event.restaurant}</p>
                <p class="text-sm text-zinc-900">{event.action}</p>
              </div>
              <div class="ml-auto font-medium">
                {#if event.status === 'OK'}
                  <span class="inline-flex items-center rounded-full border border-zinc-200 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 text-emerald-600 bg-emerald-50">Active</span>
                {:else if event.status === 'WARN'}
                  <span class="inline-flex items-center rounded-full border border-zinc-200 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 text-amber-600 bg-amber-50">Warning</span>
                {:else}
                  <span class="inline-flex items-center rounded-full border border-zinc-200 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 text-red-600 bg-red-50">Error</span>
                {/if}
              </div>
            </div>
          {/each}
          {#if recentActivity.length === 0}
            <div class="text-sm text-zinc-900 text-center py-4">No recent activity</div>
          {/if}
        </div>
      </CardContent>
    </Card>
  </div>
</div>
