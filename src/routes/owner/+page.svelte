<script lang="ts">
  import { ShoppingBag, TrendingUp, Users, BellRing, CheckCircle, Clock, Table as TableIcon } from 'lucide-svelte';
  import { adminOrders, waiterRequests, pendingWaiterCount } from '$lib/stores/admin';
  import { formatCurrency } from '$lib/utils';

  let { data } = $props();
  let tables = $derived(data.tables || []);
  let todayDate = $derived(new Intl.DateTimeFormat('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date()));
  
  let totalOrdersToday = $derived($adminOrders.length);
  let todayRevenue = $derived($adminOrders.reduce((sum, order) => sum + order.total_amount, 0));
  let occupiedTables = $derived(
    tables.filter(t => $adminOrders.some(o => o.table_id === t.id && ['pending', 'preparing', 'ready'].includes(o.status))).length
  );
  
  function getTableStatus(tableId: string) {
    const activeOrders = $adminOrders.filter(o => o.table_id === tableId && ['pending', 'preparing', 'ready'].includes(o.status));
    const hasWaiterRequest = $waiterRequests.some(r => r.table_id === tableId && r.status === 'pending');
    if (hasWaiterRequest) return { color: 'border-red-200 bg-red-50 text-red-700', dot: 'bg-red-500', label: 'Waiter Requested' };
    if (activeOrders.some(o => o.status === 'ready')) return { color: 'border-purple-200 bg-purple-50 text-purple-700', dot: 'bg-purple-500', label: 'Order Ready' };
    if (activeOrders.length > 0) return { color: 'border-orange-200 bg-orange-50 text-orange-700', dot: 'bg-orange-500', label: 'Occupied' };
    return { color: 'border-green-200 bg-green-50 text-green-700', dot: 'bg-green-500', label: 'Available' };
  }
</script>

<svelte:head>
  <title>Dashboard | Owner</title>
</svelte:head>

<div class="space-y-6">
  <!-- Page Header -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-zinc-950">Dashboard</h1>
      <p class="text-sm text-zinc-500 mt-0.5">{todayDate}</p>
    </div>
  </div>

  <!-- Stats Cards -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div class="flex items-center justify-between mb-3">
        <p class="text-sm font-medium text-zinc-500">Total Orders</p>
        <div class="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
          <ShoppingBag size={18} class="text-blue-600" />
        </div>
      </div>
      <p class="text-3xl font-bold text-zinc-950">{totalOrdersToday}</p>
    </div>

    <div class="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div class="flex items-center justify-between mb-3">
        <p class="text-sm font-medium text-zinc-500">Revenue Today</p>
        <div class="h-9 w-9 rounded-lg bg-green-50 flex items-center justify-center">
          <TrendingUp size={18} class="text-green-600" />
        </div>
      </div>
      <p class="text-3xl font-bold text-zinc-950">{formatCurrency(todayRevenue)}</p>
    </div>

    <div class="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div class="flex items-center justify-between mb-3">
        <p class="text-sm font-medium text-zinc-500">Occupied Tables</p>
        <div class="h-9 w-9 rounded-lg bg-orange-50 flex items-center justify-center">
          <TableIcon size={18} class="text-orange-600" />
        </div>
      </div>
      <p class="text-3xl font-bold text-zinc-950">{occupiedTables} <span class="text-sm font-normal text-zinc-400">/ {tables.length}</span></p>
    </div>

    <div class="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div class="flex items-center justify-between mb-3">
        <p class="text-sm font-medium text-zinc-500">Pending Requests</p>
        <div class="h-9 w-9 rounded-lg bg-red-50 flex items-center justify-center">
          <BellRing size={18} class="text-red-600" />
        </div>
      </div>
      <p class="text-3xl font-bold text-zinc-950">{$pendingWaiterCount}</p>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Floor Plan -->
    <div class="lg:col-span-2">
      <div class="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div class="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <h2 class="text-base font-semibold text-zinc-950">Floor Plan</h2>
          <span class="text-xs text-zinc-400">{tables.length} tables</span>
        </div>
        <div class="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {#each tables as table}
            {@const status = getTableStatus(table.id)}
            <div class="rounded-lg border {status.color} p-4 flex flex-col items-center justify-center text-center h-28 transition-all hover:shadow-sm">
              <span class="text-2xl font-bold mb-1">{table.display_name || `T${table.table_number}`}</span>
              <span class="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold">
                <span class="h-1.5 w-1.5 rounded-full {status.dot}"></span>
                {status.label}
              </span>
            </div>
          {/each}
          {#if tables.length === 0}
            <div class="col-span-3 py-12 text-center text-sm text-zinc-400">
              No tables configured yet
            </div>
          {/if}
        </div>
      </div>
    </div>

    <!-- Service Requests -->
    <div>
      <div class="rounded-xl border border-zinc-200 bg-white shadow-sm h-full flex flex-col">
        <div class="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <h2 class="text-base font-semibold text-zinc-950">Service Requests</h2>
          {#if $pendingWaiterCount > 0}
            <span class="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">{$pendingWaiterCount} new</span>
          {/if}
        </div>
        <div class="flex-1 overflow-y-auto p-4 space-y-3 max-h-[400px]">
          {#if $waiterRequests.filter(r => r.status !== 'resolved').length === 0}
            <div class="flex flex-col items-center justify-center py-12 text-center text-zinc-400">
              <CheckCircle size={36} class="mb-3 text-zinc-200" />
              <p class="text-sm font-medium">All caught up!</p>
              <p class="text-xs mt-1">No pending service requests.</p>
            </div>
          {:else}
            {#each $waiterRequests.filter(r => r.status !== 'resolved').sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) as request}
              <div class="rounded-lg border border-zinc-200 p-4 {request.status === 'pending' ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-yellow-400'}">
                <div class="flex justify-between items-start mb-2">
                  <div>
                    <h3 class="font-semibold text-sm text-zinc-900">{tables.find(t => t.id === request.table_id)?.display_name || 'Unknown Table'}</h3>
                    <p class="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                      <Clock size={10} />
                      {new Date(request.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <span class="text-[10px] uppercase font-bold {request.status === 'pending' ? 'text-red-500' : 'text-yellow-500'}">{request.status}</span>
                </div>
                <div class="flex gap-2 mt-2">
                  {#if request.status === 'pending'}
                    <button
                      class="flex-1 py-1.5 px-3 text-xs font-medium rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 transition-colors"
                      onclick={() => waiterRequests.acknowledge(request.id)}
                    >Acknowledge</button>
                  {/if}
                  <button
                    class="flex-1 py-1.5 px-3 text-xs font-medium rounded-md border border-green-200 bg-green-50 hover:bg-green-100 text-green-700 transition-colors"
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
</div>
