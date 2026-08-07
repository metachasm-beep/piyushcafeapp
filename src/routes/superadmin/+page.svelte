<script lang="ts">
  import type { PageData } from './$types';
  import { TrendingUp, Users, ShoppingBag, Store, ArrowUpRight, ArrowDownRight, Activity, Zap, AlertTriangle, CheckCircle2, RotateCw } from 'lucide-svelte';
  import { formatCurrency } from '$lib/utils';
  import InteractiveRevenueChart from '$lib/components/InteractiveRevenueChart.svelte';
  import { slide, fade, scale } from 'svelte/transition';
  import { tooltip } from '$lib/actions/tooltip';
  import { toast } from 'svelte-sonner';
  import { onMount } from 'svelte';
  import confetti from 'canvas-confetti';

  import Card from '$lib/components/ui/card.svelte';
  import CardHeader from '$lib/components/ui/card-header.svelte';
  import CardTitle from '$lib/components/ui/card-title.svelte';
  import CardContent from '$lib/components/ui/card-content.svelte';
  import Badge from '$lib/components/ui/badge.svelte';
  import Skeleton from '$lib/components/ui/skeleton.svelte';

  let { data }: { data: PageData } = $props();

  let stats = $derived([
    { label: 'Total Revenue', value: data.stats.totalRevenue, isCurrency: true, trend: 12, up: true, color: 'text-indigo-600', bg: 'bg-indigo-100', icon: TrendingUp, target: 150000 },
    { label: 'Active Restaurants', value: data.stats.activeRestaurantsCount, isCurrency: false, trend: 0, up: true, color: 'text-violet-600', bg: 'bg-violet-100', icon: Store, target: 5 },
    { label: 'Platform Fees', value: data.stats.platformFees, isCurrency: true, trend: 8, up: true, color: 'text-emerald-600', bg: 'bg-emerald-100', icon: Activity, target: 3000 },
    { label: 'Total Orders', value: data.stats.totalOrdersToday, isCurrency: false, trend: -3, up: false, color: 'text-cyan-600', bg: 'bg-cyan-100', icon: ShoppingBag, target: 200 },
  ]);

  let recentActivity = $state(data.recentActivity);
  let chartData = $derived(data.chartData.map(d => ({ date: new Date(d.date), revenue: d.revenue })));
  let amounts = $derived(chartData.map(d => d.revenue));
  
  let isTargetReached = $derived(data.stats.totalRevenue > 100000); // Easter egg trigger

  function triggerConfetti() {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#8b5cf6', '#22c55e']
    });
  }

  function clearAlerts() {
    recentActivity = recentActivity.filter(a => a.status === 'OK');
    toast.success('Alerts cleared');
    triggerConfetti();
  }

  // Magnetic button spell
  function handleMagneticMove(e: MouseEvent) {
    const btn = e.currentTarget as HTMLButtonElement;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
  }
  
  function handleMagneticLeave(e: MouseEvent) {
    const btn = e.currentTarget as HTMLButtonElement;
    btn.style.transform = `translate(0px, 0px)`;
  }

</script>

<svelte:head><title>Dashboard · Superadmin</title></svelte:head>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="min-h-screen font-sans antialiased bg-slate-50 text-slate-900 transition-colors duration-1000 {isTargetReached ? 'bg-amber-50/30' : ''}">
  
  <!-- Header -->
  <header class="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm shadow-indigo-600/20">
          <Zap size={18} />
        </div>
        <div>
          <h1 class="text-xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <!-- Magnetic Button Spell -->
        <button 
          class="relative px-4 py-2 bg-slate-900 text-white font-medium rounded-lg shadow-sm hover:bg-slate-800 transition-colors"
          style="transition: transform 0.2s cubic-bezier(0.33, 1, 0.68, 1);"
          onmousemove={handleMagneticMove}
          onmouseleave={handleMagneticLeave}
          onclick={triggerConfetti}
        >
          Export Report
        </button>
      </div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    
    <!-- Top Stats Row -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {#each stats as stat, i}
        <div in:scale={{ duration: 400, delay: i * 100, start: 0.95 }}>
          <Card variant="interactive" class="h-full group">
            <CardContent class="p-6">
              <div class="flex items-center justify-between">
                <div class="w-10 h-10 rounded-full {stat.bg} {stat.color} flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3">
                  <stat.icon size={20} />
                </div>
                <Badge variant={stat.up ? 'success' : 'destructive'} class="rounded-full px-2 py-0.5">
                  {#if stat.up}<ArrowUpRight size={14} class="mr-1" />{:else}<ArrowDownRight size={14} class="mr-1" />{/if}
                  {Math.abs(stat.trend)}%
                </Badge>
              </div>
              <div class="mt-4">
                <p class="text-sm font-medium text-slate-500">{stat.label}</p>
                <p class="text-3xl font-bold tracking-tight text-slate-900 mt-1">
                  {stat.isCurrency ? formatCurrency(stat.value) : stat.value.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      {/each}
    </div>

    <!-- Main Content Area -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- Revenue Chart (Spans 2 columns) -->
      <div class="lg:col-span-2">
        <Card class="h-[450px] flex flex-col">
          <CardHeader class="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <CardTitle class="text-lg">Revenue Overview</CardTitle>
              <p class="text-sm text-slate-500 mt-1">Interactive brushing and zooming enabled.</p>
            </div>
            <div class="text-2xl font-bold text-slate-900">
              {formatCurrency(amounts.reduce((a: number, b: number) => a+b, 0))}
            </div>
          </CardHeader>
          <CardContent class="flex-1 relative pt-4">
            <!-- Ensure chart uses light mode colors or we update it. Assuming it adapts. -->
            <InteractiveRevenueChart data={chartData} />
          </CardContent>
        </Card>
      </div>

      <!-- Activity Feed -->
      <div class="lg:col-span-1">
        <Card class="h-[450px] flex flex-col">
          <CardHeader class="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
            <CardTitle class="text-lg flex items-center gap-2">
              <Activity size={18} class="text-indigo-600" />
              Activity Feed
            </CardTitle>
            <button 
              class="text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md transition-colors"
              onclick={clearAlerts}
            >
              Clear Alerts
            </button>
          </CardHeader>
          <CardContent class="p-0 flex-1 overflow-y-auto">
            <div class="divide-y divide-slate-100">
              {#each recentActivity as event (event.id || event.time + event.restaurant)}
                <div out:slide={{ duration: 300 }} class="p-4 hover:bg-slate-50 transition-colors group cursor-default">
                  <div class="flex items-start gap-3">
                    <div class="mt-1">
                      <div class="w-2 h-2 rounded-full {event.status === 'OK' ? 'bg-emerald-500' : event.status === 'WARN' ? 'bg-amber-500' : 'bg-red-500'}"></div>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex justify-between items-center">
                        <p class="text-sm font-semibold text-slate-900 truncate">{event.restaurant}</p>
                        <span class="text-xs text-slate-400">{event.time}</span>
                      </div>
                      <p class="text-sm text-slate-600 mt-0.5 leading-relaxed">{event.action}</p>
                    </div>
                  </div>
                </div>
              {:else}
                <div in:fade class="p-8 text-center text-slate-400 flex flex-col items-center justify-center h-full gap-3">
                  <CheckCircle2 size={32} class="text-emerald-400" />
                  <p class="text-sm font-medium">All caught up!</p>
                </div>
              {/each}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  </main>
</div>
