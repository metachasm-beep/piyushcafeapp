<script lang="ts">
  import { ShoppingBag, TrendingUp, Users, BellRing, CheckCircle, Clock, Table as TableIcon, Receipt } from 'lucide-svelte';
  import { adminOrders, waiterRequests, pendingWaiterCount } from '$lib/stores/admin';
  import { formatCurrency } from '$lib/utils';
  import { fly } from 'svelte/transition';
  import { spring } from 'svelte/motion';
  import { onMount } from 'svelte';

  let { data } = $props();
  let tables = $derived(data.tables || []);
  let todayDate = $derived(new Intl.DateTimeFormat('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date()));
  
  let totalOrdersToday = $derived($adminOrders.length);
  let todayRevenue = $derived($adminOrders.reduce((sum, order) => sum + order.total_amount, 0));
  let occupiedTables = $derived(
    tables.filter((t: any) => $adminOrders.some(o => o.table_id === t.id && ['pending', 'preparing', 'ready'].includes(o.status))).length
  );
  
  let animatedRevenue = spring(0, { stiffness: 0.05, damping: 0.8 });
  let animatedOrders = spring(0, { stiffness: 0.05, damping: 0.8 });
  let animatedTables = spring(0, { stiffness: 0.05, damping: 0.8 });
  let animatedWaiters = spring(0, { stiffness: 0.05, damping: 0.8 });

  $effect(() => {
    animatedRevenue.set(todayRevenue);
    animatedOrders.set(totalOrdersToday);
    animatedTables.set(occupiedTables);
    animatedWaiters.set($pendingWaiterCount);
  });

  function getTableStatus(tableId: string) {
    const activeOrders = $adminOrders.filter(o => o.table_id === tableId && ['pending', 'preparing', 'ready'].includes(o.status));
    const hasWaiterRequest = $waiterRequests.some(r => r.table_id === tableId && r.status === 'pending');
    if (hasWaiterRequest) return { color: 'border-blue-200 bg-blue-50 text-blue-700', dot: 'bg-blue-600', label: 'Waiter Requested' };
    if (activeOrders.some(o => o.status === 'ready')) return { color: 'border-zinc-200 bg-zinc-50 text-zinc-900', dot: 'bg-zinc-800', label: 'Order Ready' };
    if (activeOrders.length > 0) return { color: 'border-zinc-200 bg-white text-zinc-900', dot: 'bg-zinc-400', label: 'Occupied' };
    return { color: 'border-transparent bg-zinc-50 text-zinc-400', dot: 'bg-zinc-200', label: 'Available' };
  }

  let mounted = $state(false);
  onMount(() => {
    mounted = true;
  });
</script>

<svelte:head>
  <title>Dashboard | Owner</title>
</svelte:head>

<style>
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>

<div class="space-y-8 pb-12">
  <!-- Page Header -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
    <div in:fly={{ y: 10, duration: 400, delay: 0 }}>
      <h1 class="text-3xl font-bold tracking-tight text-zinc-950">Dashboard</h1>
      <p class="text-sm font-medium text-zinc-500 mt-1">{todayDate}</p>
    </div>
  </div>

  {#if mounted}
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div in:fly={{ y: 20, duration: 400, delay: 50 }} class="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
        <div class="flex items-center justify-between mb-4">
          <p class="text-xs font-semibold uppercase tracking-wider text-zinc-500">Total Orders</p>
          <div class="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center">
            <ShoppingBag size={14} class="text-zinc-900" />
          </div>
        </div>
        <p class="text-3xl font-bold tracking-tighter text-zinc-950">{Math.round($animatedOrders)}</p>
      </div>

      <div in:fly={{ y: 20, duration: 400, delay: 100 }} class="relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-950 text-white p-5 shadow-sm transition-all hover:shadow-md">
        <div class="flex items-center justify-between mb-4">
          <p class="text-xs font-semibold uppercase tracking-wider text-zinc-400">Revenue Today</p>
          <div class="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center">
            <TrendingUp size={14} class="text-white" />
          </div>
        </div>
        <p class="text-3xl font-bold tracking-tighter">{formatCurrency($animatedRevenue)}</p>
      </div>

      <div in:fly={{ y: 20, duration: 400, delay: 150 }} class="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
        <div class="flex items-center justify-between mb-4">
          <p class="text-xs font-semibold uppercase tracking-wider text-zinc-500">Occupied Tables</p>
          <div class="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center">
            <TableIcon size={14} class="text-zinc-900" />
          </div>
        </div>
        <p class="text-3xl font-bold tracking-tighter text-zinc-950">{Math.round($animatedTables)} <span class="text-sm font-medium text-zinc-400">/ {tables.length}</span></p>
      </div>

      <div in:fly={{ y: 20, duration: 400, delay: 200 }} class="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:shadow-md group">
        <div class="flex items-center justify-between mb-4">
          <p class="text-xs font-semibold uppercase tracking-wider text-zinc-500">Pending Requests</p>
          <div class="h-8 w-8 rounded-full {$pendingWaiterCount > 0 ? 'bg-blue-100' : 'bg-zinc-100'} flex items-center justify-center transition-colors">
            <BellRing size={14} class="{$pendingWaiterCount > 0 ? 'text-blue-600' : 'text-zinc-900'}" />
          </div>
        </div>
        <p class="text-3xl font-bold tracking-tighter text-zinc-950">{Math.round($animatedWaiters)}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <!-- Floor Plan -->
      <div in:fly={{ y: 20, duration: 400, delay: 250 }} class="xl:col-span-2">
        <div class="flex items-end justify-between mb-4">
          <h2 class="text-lg font-bold tracking-tight text-zinc-950">Floor Plan</h2>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {#each tables as table, i}
            {@const status = getTableStatus(table.id)}
            <div in:fly={{ y: 15, duration: 300, delay: 300 + (i * 50) }} class="rounded-xl border {status.color} p-4 flex flex-col items-center justify-center text-center h-28 transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer">
              <span class="text-2xl font-bold tracking-tight mb-2">{table.display_name || `T${table.table_number}`}</span>
              <span class="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold">
                <span class="h-1.5 w-1.5 rounded-full {status.dot}"></span>
                {status.label}
              </span>
            </div>
          {/each}
          {#if tables.length === 0}
            <div class="col-span-full py-16 text-center">
              <p class="text-sm font-semibold text-zinc-400">No tables configured yet.</p>
            </div>
          {/if}
        </div>
      </div>

      <!-- Service Requests -->
      <div in:fly={{ y: 20, duration: 400, delay: 300 }}>
        <div class="flex items-end justify-between mb-4">
          <h2 class="text-lg font-bold tracking-tight text-zinc-950">Service Requests</h2>
          {#if $pendingWaiterCount > 0}
            <span class="inline-flex items-center rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">{$pendingWaiterCount} new</span>
          {/if}
        </div>
        
        <div class="rounded-xl bg-white border border-zinc-200 overflow-hidden shadow-sm">
          <div class="flex flex-row overflow-x-auto snap-x xl:flex-col p-4 gap-3 max-h-[500px] hide-scrollbar">
            {#if $waiterRequests.filter(r => r.status !== 'resolved').length === 0}
              <div class="flex flex-col items-center justify-center py-16 text-center text-zinc-400 min-w-full xl:min-w-0">
                <div class="relative w-16 h-16 mb-4 flex items-center justify-center">
                  <div class="absolute inset-0 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] rounded-full bg-zinc-100"></div>
                  <Receipt size={28} class="text-zinc-300 animate-[bounce_2s_infinite]" />
                </div>
                <p class="text-[11px] font-bold text-zinc-600 uppercase tracking-widest">ALL CAUGHT UP</p>
                <p class="text-xs mt-1 text-zinc-400 max-w-[200px]">No pending requests right now.</p>
              </div>
            {:else}
              {#each $waiterRequests.filter(r => r.status !== 'resolved').sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) as request, i}
                <div in:fly={{ x: 20, duration: 300, delay: 350 + (i * 75) }} class="min-w-[280px] snap-center xl:min-w-0 rounded-lg border border-zinc-200 p-4 bg-zinc-50/50">
                  <div class="flex justify-between items-start mb-3">
                    <div>
                      <h3 class="font-bold text-sm tracking-tight text-zinc-900">{tables.find((t: any) => t.id === request.table_id)?.display_name || 'Unknown Table'}</h3>
                      <p class="text-[11px] font-medium text-zinc-500 flex items-center gap-1.5 mt-1">
                        <Clock size={12} />
                        {new Date(request.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {#if request.status === 'pending'}
                      <span class="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                    {/if}
                  </div>
                  <div class="flex gap-2 mt-4">
                    {#if request.status === 'pending'}
                      <button
                        class="flex-1 py-2 px-3 text-xs font-bold rounded-md border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-900 transition-colors shadow-sm"
                        onclick={() => waiterRequests.acknowledge(request.id)}
                      >Acknowledge</button>
                    {/if}
                    <button
                      class="flex-1 py-2 px-3 text-xs font-bold rounded-md border border-transparent bg-zinc-900 hover:bg-zinc-800 text-white transition-colors shadow-sm"
                      onclick={() => waiterRequests.resolve(request.id)}
                    >Resolve</button>
                  </div>
                </div>
              {/each}
            {/if}
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
