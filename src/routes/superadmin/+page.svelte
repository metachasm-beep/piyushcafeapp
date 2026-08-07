<script lang="ts">
  import type { PageData } from './$types';
  import { TrendingUp, Users, ShoppingBag, Store, ArrowUpRight, ArrowDownRight, Activity, Zap, AlertTriangle, CheckCircle2 } from 'lucide-svelte';
  import { formatCurrency } from '$lib/utils';
  import InteractiveRevenueChart from '$lib/components/InteractiveRevenueChart.svelte';
  import LiveOrderParticles from '$lib/components/LiveOrderParticles.svelte';
  import { slide, fade, fly } from 'svelte/transition';
  import { tooltip } from '$lib/actions/tooltip';
  import { toast } from 'svelte-sonner';
  import { onMount } from 'svelte';

  import Card from '$lib/components/ui/card.svelte';
  import CardHeader from '$lib/components/ui/card-header.svelte';
  import CardTitle from '$lib/components/ui/card-title.svelte';
  import CardContent from '$lib/components/ui/card-content.svelte';
  import Badge from '$lib/components/ui/badge.svelte';
  import Skeleton from '$lib/components/ui/skeleton.svelte';

  let expandedStatIndex = $state<number | null>(null);

  let { data }: { data: PageData } = $props();

  let stats = $derived([
    { label: 'Total Revenue', value: data.stats.totalRevenue, isCurrency: true, trend: 12, up: true, color: '#6366f1', icon: TrendingUp, target: 150000 },
    { label: 'Active Restaurants', value: data.stats.activeRestaurantsCount, isCurrency: false, trend: 0, up: true, color: '#8b5cf6', icon: Store, target: 5 },
    { label: 'Platform Fees', value: data.stats.platformFees, isCurrency: true, trend: 8, up: true, color: '#22c55e', icon: Activity, target: 3000 },
    { label: 'Total Orders', value: data.stats.totalOrdersToday, isCurrency: false, trend: -3, up: false, color: '#06b6d4', icon: ShoppingBag, target: 200 },
  ]);

  let recentActivity = $derived(data.recentActivity);
  let chartData = $derived(data.chartData.map(d => ({ date: new Date(d.date), revenue: d.revenue })));
  let amounts = $derived(chartData.map(d => d.revenue));

  function statusColor(s: string) {
    if (s === 'OK') return 'success';
    if (s === 'WARN') return 'warning';
    if (s === 'ERR') return 'destructive';
    return 'default';
  }

  let startY = 0;
  let currentY = $state(0);
  let isRefreshing = $state(false);
  let mounted = $state(false);
  
  // Parallax rotation state based on mouse movement to give a subtle float effect
  let mouseX = $state(0);
  let mouseY = $state(0);

  onMount(() => {
    mounted = true;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth) - 0.5;
      mouseY = (e.clientY / window.innerHeight) - 0.5;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  });

  function handleTouchStart(e: TouchEvent) {
    if (window.scrollY === 0) startY = e.touches[0].clientY;
  }

  function handleTouchMove(e: TouchEvent) {
    if (startY > 0) {
      const y = e.touches[0].clientY;
      if (y > startY) {
        currentY = Math.min((y - startY) * 0.4, 80);
        if (e.cancelable) e.preventDefault();
      }
    }
  }

  function handleTouchEnd() {
    if (currentY > 60 && !isRefreshing) {
      isRefreshing = true;
      toast.success('Refreshing telemetry...');
      setTimeout(() => {
        isRefreshing = false;
        currentY = 0;
        startY = 0;
      }, 1500);
    } else {
      currentY = 0;
      startY = 0;
    }
  }
</script>

<svelte:head><title>Command Center · Antigravity Spatial</title></svelte:head>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div 
  class="relative z-10 text-zinc-100 min-h-screen bg-[#050505] font-sans antialiased overflow-hidden perspective-1000"
  style="transform: translateY({currentY}px); transition: {isRefreshing ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'};"
  ontouchstart={handleTouchStart}
  ontouchmove={handleTouchMove}
  ontouchend={handleTouchEnd}
>
  
  <!-- Deep Space Telemetry Background Grid -->
  <div class="fixed inset-0 pointer-events-none opacity-20"
       style="background-image: linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px); background-size: 50px 50px; transform: perspective(1000px) rotateX(60deg) translateY(-100px) translateZ(-200px);">
  </div>
  
  <div class="absolute inset-0 pointer-events-none opacity-50 z-0">
     <LiveOrderParticles />
  </div>
  
  {#if currentY > 0}
    <div class="absolute top-[20px] left-0 right-0 flex justify-center items-center h-[50px] z-50">
      <div class="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin opacity-[{Math.min(currentY / 60, 1)}] shadow-[0_0_15px_rgba(255,255,255,0.5)]"></div>
    </div>
  {/if}

  <!-- Floating Header -->
  <div class="relative z-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-8 px-8 lg:px-12 backdrop-blur-md bg-black/20 border-b border-white/5 pb-6 shadow-[0_20px_40px_rgba(0,0,0,0.5)]" style="transform: translateZ(50px);">
    <div>
      <h1 class="text-4xl font-bold tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">Spatial Command</h1>
      <p class="text-xs text-white/50 mt-2 font-mono uppercase tracking-[0.2em]">Network Telemetry / Node Alpha</p>
    </div>
    <div class="flex gap-3">
      <button class="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full font-mono text-xs uppercase tracking-widest transition-all active:scale-95 border border-white/20 backdrop-blur-xl shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]" onclick={() => toast.success('Telemetry exported')}>
        Extract Data
      </button>
    </div>
  </div>

  <div class="relative w-full h-[calc(100vh-120px)] flex items-center justify-center p-8 lg:p-16">
    <!-- Isometric 3D Container -->
    {#if mounted}
    <div 
      class="w-full max-w-7xl grid grid-cols-1 xl:grid-cols-12 gap-8 preserve-3d"
      style="transform: perspective(1500px) rotateX({55 - mouseY * 10}deg) rotateZ({-35 - mouseX * 10}deg) translateZ({mouseY * 50}px); transition: transform 0.5s ease-out;"
    >
      
      <!-- Main Content (Left) -->
      <div class="xl:col-span-8 flex flex-col gap-8 preserve-3d">
        
        <!-- Top Stats Row -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-8 preserve-3d">
          {#each stats.slice(0, 2) as stat, i}
            <div in:fly={{ y: -200, duration: 1000, delay: i * 150, opacity: 0 }} class="preserve-3d">
              <Card class="h-full hover:shadow-[0_40px_80px_rgba(0,0,0,0.6)] cursor-pointer group hover:-translate-y-2 transition-transform duration-500">
                <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0 border-b border-white/5">
                  <CardTitle class="text-xs font-mono uppercase tracking-widest text-white/50 group-hover:text-white/80 transition-colors">{stat.label}</CardTitle>
                  <stat.icon class="w-4 h-4 text-white/30 group-hover:text-white/70 transition-colors drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]" />
                </CardHeader>
                <CardContent class="pt-6">
                  <div class="text-4xl font-light tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                    {stat.isCurrency ? formatCurrency(stat.value) : stat.value.toLocaleString()}
                  </div>
                  <div class="flex items-center gap-2 mt-4" style="transform: translateZ(10px);">
                    <Badge variant={stat.up ? 'success' : 'destructive'} class="rounded-full px-2 py-0.5 bg-white/5 backdrop-blur-md border border-white/10">
                      {#if stat.up}<ArrowUpRight class="w-3 h-3 mr-1" />{:else}<ArrowDownRight class="w-3 h-3 mr-1" />{/if}
                      {Math.abs(stat.trend)}%
                    </Badge>
                    <span class="text-[10px] uppercase tracking-wider text-white/40">vs cycle</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          {/each}
        </div>

        <!-- Revenue Chart -->
        <div in:fly={{ y: -200, duration: 1000, delay: 300, opacity: 0 }} class="preserve-3d h-[400px]">
          <Card class="h-full flex flex-col group hover:shadow-[0_50px_100px_rgba(0,0,0,0.5)] transition-all duration-700">
            <CardHeader class="flex flex-row items-center justify-between border-b border-white/5 backdrop-blur-md bg-white/[0.02]">
              <div style="transform: translateZ(20px);">
                <CardTitle class="text-sm font-mono uppercase tracking-widest">Revenue Stream</CardTitle>
                <p class="text-[10px] text-white/40 mt-1 uppercase tracking-wider">Spatial brushing enabled</p>
              </div>
              <div class="text-2xl font-light tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" style="transform: translateZ(30px);">
                {formatCurrency(amounts.reduce((a: number, b: number) => a+b, 0))}
              </div>
            </CardHeader>
            <CardContent class="flex-1 relative pt-4" style="transform: translateZ(40px);">
              <InteractiveRevenueChart data={chartData} />
            </CardContent>
          </Card>
        </div>
      </div>

      <!-- Right Column (Alerts & Secondary Stats) -->
      <div class="xl:col-span-4 flex flex-col gap-8 preserve-3d">
        
        <div class="grid grid-cols-2 gap-8 preserve-3d">
          {#each stats.slice(2, 4) as stat, i}
            <div in:fly={{ y: -200, duration: 1000, delay: 450 + (i * 150), opacity: 0 }} class="preserve-3d">
              <Card class="hover:shadow-[0_40px_80px_rgba(0,0,0,0.6)] cursor-pointer group hover:-translate-y-2 transition-transform duration-500 h-full">
                <CardHeader class="pb-2 flex flex-col items-center text-center">
                  <stat.icon class="w-6 h-6 text-white/30 group-hover:text-white/80 transition-colors drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] mb-3" />
                  <CardTitle class="text-[10px] font-medium text-white/40 uppercase tracking-[0.2em]">{stat.label}</CardTitle>
                </CardHeader>
                <CardContent class="text-center pt-2">
                  <div class="text-2xl font-light tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                    {stat.isCurrency ? formatCurrency(stat.value) : stat.value.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            </div>
          {/each}
        </div>

        <!-- Alerts & Action Center -->
        <div in:fly={{ y: -200, duration: 1000, delay: 750, opacity: 0 }} class="preserve-3d flex-1">
          <Card class="h-full flex flex-col group hover:shadow-[0_50px_100px_rgba(0,0,0,0.5)] transition-all duration-700 max-h-[500px]">
            <CardHeader class="flex flex-row items-center justify-between pb-4 border-b border-white/5 bg-white/[0.02]">
              <CardTitle class="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-white/70" style="transform: translateZ(20px);">
                <AlertTriangle class="w-4 h-4 text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]" />
                Network Events
              </CardTitle>
              <Badge variant="warning" class="bg-white/10 text-white border-white/20 blur-none backdrop-blur-md shadow-[0_0_10px_rgba(255,255,255,0.2)]" style="transform: translateZ(20px);">3 Pending</Badge>
            </CardHeader>
            <CardContent class="p-0 flex-1 overflow-y-auto custom-scrollbar" style="transform: translateZ(10px);">
              <div class="divide-y divide-white/5">
                
                <!-- High Priority Action -->
                <div class="p-5 flex items-start gap-4 hover:bg-white/[0.05] transition-colors cursor-pointer group/item border-l-2 border-transparent hover:border-white">
                  <div class="mt-1"><div class="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,1)] animate-pulse"></div></div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-light text-white tracking-wide">Node Request</p>
                    <p class="text-[11px] text-white/50 mt-1 truncate font-mono">Bistro Cafe connection pending.</p>
                  </div>
                  <button class="text-[10px] font-mono uppercase tracking-widest text-white/40 group-hover/item:text-white transition-colors border border-white/10 px-2 py-1 rounded-sm hover:bg-white/10">Authorize</button>
                </div>

                <!-- System Log Feed -->
                {#each recentActivity as event}
                  <div class="p-5 flex items-start gap-4 hover:bg-white/[0.03] transition-colors border-l-2 border-transparent hover:border-white/20">
                    <div class="mt-1"><div class="w-1.5 h-1.5 rounded-full {event.status === 'OK' ? 'bg-white/60 shadow-[0_0_5px_rgba(255,255,255,0.5)]' : event.status === 'WARN' ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,1)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'}"></div></div>
                    <div class="flex-1 min-w-0">
                      <div class="flex justify-between items-center">
                        <p class="text-xs font-light text-white/80 tracking-wide truncate">{event.restaurant}</p>
                        <span class="text-[9px] text-white/30 font-mono tracking-widest">{event.time}</span>
                      </div>
                      <p class="text-[11px] text-white/40 mt-1 font-mono">{event.action}</p>
                    </div>
                  </div>
                {/each}
                
                <div class="p-6 flex items-center justify-center gap-3 text-white/30">
                  <div class="w-1.5 h-1.5 rounded-full bg-white/30 animate-ping"></div>
                  <span class="text-[10px] font-mono uppercase tracking-[0.2em]">Listening to network...</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
    {/if}
  </div>
</div>

<style>
  .preserve-3d {
    transform-style: preserve-3d;
  }
  
  /* Custom scrollbar for network events */
  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.1);
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255,255,255,0.3);
  }
</style>
