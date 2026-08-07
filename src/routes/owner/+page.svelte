<script lang="ts">
  import { adminOrders, ordersByStatus, waiterRequests, pendingWaiterCount } from '$lib/stores/admin';
  import { formatCurrency, timeAgo } from '$lib/utils';
  import { ShoppingBag, TrendingUp, Users, BellRing, CheckCircle, Clock } from '@lucide/svelte';
  
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
    
    if (hasWaiterRequest) return { state: 'requested', color: 'border-red-500/50 bg-red-500/10 text-red-400', label: 'Waiter Requested' };
    if (activeOrders.some(o => o.status === 'ready')) return { state: 'ready', color: 'border-purple-500/50 bg-purple-500/10 text-purple-400', label: 'Order Ready' };
    if (activeOrders.length > 0) return { state: 'active', color: 'border-[var(--color-brand)] bg-[var(--color-brand)]/10 text-[var(--color-brand)]', label: 'Occupied' };
    
    return { state: 'free', color: 'border-green-500/50 bg-green-500/10 text-green-400', label: 'Available' };
  }

  function handleAcknowledgeRequest(id: string) {
    waiterRequests.acknowledge(id);
  }

  function handleResolveRequest(id: string) {
    waiterRequests.resolve(id);
  }
</script>

<div class="space-y-8 pb-12">
  <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
    <div>
      <h1 class="text-3xl font-display font-bold text-[var(--color-text-primary)]">Dashboard</h1>
      <p class="text-[var(--color-text-secondary)] mt-1">{todayDate}</p>
    </div>
  </div>

  <!-- Stats Row -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="glass p-6 rounded-xl flex items-center gap-4">
      <div class="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
        <ShoppingBag size={24} />
      </div>
      <div>
        <p class="text-[var(--color-text-secondary)] text-sm font-medium">Total Orders</p>
        <p class="text-2xl font-bold">{totalOrdersToday}</p>
      </div>
    </div>
    
    <div class="glass p-6 rounded-xl flex items-center gap-4">
      <div class="w-12 h-12 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center">
        <TrendingUp size={24} />
      </div>
      <div>
        <p class="text-[var(--color-text-secondary)] text-sm font-medium">Revenue Today</p>
        <p class="text-2xl font-bold">{formatCurrency(todayRevenue)}</p>
      </div>
    </div>
    
    <div class="glass p-6 rounded-xl flex items-center gap-4">
      <div class="w-12 h-12 rounded-full bg-[var(--color-brand)]/20 text-[var(--color-brand)] flex items-center justify-center">
        <Users size={24} />
      </div>
      <div>
        <p class="text-[var(--color-text-secondary)] text-sm font-medium">Occupied Tables</p>
        <p class="text-2xl font-bold">{occupiedTables} <span class="text-sm font-normal text-[var(--color-text-secondary)]">/ {tables.length}</span></p>
      </div>
    </div>
    
    <div class="glass p-6 rounded-xl flex items-center gap-4">
      <div class="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
        <BellRing size={24} />
      </div>
      <div>
        <p class="text-[var(--color-text-secondary)] text-sm font-medium">Pending Requests</p>
        <p class="text-2xl font-bold">{$pendingWaiterCount}</p>
      </div>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <!-- Table Status Grid -->
    <div class="lg:col-span-2 space-y-4">
      <h2 class="text-xl font-display font-bold text-[var(--color-text-primary)] border-b border-[var(--color-border)] pb-2">Floor Plan</h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {#each tables as table}
          {@const status = getTableStatus(table.id)}
          <div class="glass border {status.color} p-4 rounded-xl flex flex-col items-center justify-center text-center h-32 transition-all hover:scale-[1.02]">
            <span class="text-2xl font-bold mb-1">{table.display_name}</span>
            <span class="text-xs uppercase tracking-wider font-semibold px-2 py-1 rounded-full bg-black/20">
              {status.label}
            </span>
          </div>
        {/each}
      </div>
    </div>

    <!-- Waiter Requests Panel -->
    <div class="space-y-4 flex flex-col h-full">
      <h2 class="text-xl font-display font-bold text-[var(--color-text-primary)] border-b border-[var(--color-border)] pb-2 flex items-center justify-between">
        <span>Service Requests</span>
        {#if $pendingWaiterCount > 0}
          <span class="badge bg-red-500 text-white">{$pendingWaiterCount} New</span>
        {/if}
      </h2>
      
      <div class="glass-strong rounded-xl p-4 flex-1 overflow-y-auto max-h-[500px]">
        {#if $waiterRequests.filter(r => r.status !== 'resolved').length === 0}
          <div class="flex flex-col items-center justify-center h-full text-center p-6 text-[var(--color-text-secondary)]">
            <CheckCircle size={48} class="mb-4 opacity-20" />
            <p>All caught up!</p>
            <p class="text-sm">No pending service requests.</p>
          </div>
        {:else}
          <div class="space-y-3">
            {#each $waiterRequests.filter(r => r.status !== 'resolved').sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) as request}
              <div class="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 rounded-lg animate-fade-in relative overflow-hidden">
                {#if request.status === 'pending'}
                  <div class="absolute left-0 top-0 bottom-0 w-1 bg-red-500 animate-pulse"></div>
                {:else}
                  <div class="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500"></div>
                {/if}
                
                <div class="flex justify-between items-start mb-2 pl-2">
                  <div>
                    <h3 class="font-bold text-lg">{tables.find(t => t.id === request.table_id)?.display_name || 'Unknown Table'}</h3>
                    <p class="text-xs text-[var(--color-text-secondary)] flex items-center gap-1">
                      <Clock size={12} />
                      {timeAgo(request.created_at)}
                    </p>
                  </div>
                  <span class="text-xs uppercase tracking-wider {request.status === 'pending' ? 'text-red-400' : 'text-yellow-400'} font-bold">
                    {request.status}
                  </span>
                </div>
                
                <div class="flex gap-2 mt-3 pl-2">
                  {#if request.status === 'pending'}
                    <button 
                      class="flex-1 py-1.5 px-3 bg-[var(--color-card)] hover:bg-[var(--color-surface)] border border-[var(--color-border)] rounded text-sm transition-colors"
                      onclick={() => handleAcknowledgeRequest(request.id)}
                    >
                      Acknowledge
                    </button>
                  {/if}
                  <button 
                    class="flex-1 py-1.5 px-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded text-sm transition-colors font-medium"
                    onclick={() => handleResolveRequest(request.id)}
                  >
                    Resolve
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
