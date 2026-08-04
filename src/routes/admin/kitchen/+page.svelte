<script lang="ts">
  import { adminOrders, ordersByStatus, waiterRequests, pendingWaiterCount } from '$lib/stores/admin';
  import { timeAgo } from '$lib/utils';
  import { MOCK_TABLES } from '$lib/mock-data';
  import { toast } from 'svelte-sonner';
  import { AlertTriangle, Clock, ChefHat, Check, ArrowRight } from '@lucide/svelte';

  // Columns definition
  const columns = [
    { id: 'pending', title: 'New Orders', color: 'orange', bg: 'bg-orange-500' },
    { id: 'preparing', title: 'Preparing', color: 'purple', bg: 'bg-purple-500' },
    { id: 'ready', title: 'Ready for Pickup', color: 'green', bg: 'bg-green-500' },
    { id: 'served', title: 'Served', color: 'gray', bg: 'bg-gray-500' }
  ] as const;

  function moveOrder(orderId: string, currentStatus: string) {
    let nextStatus: 'preparing' | 'ready' | 'served' | 'cancelled' = 'preparing';
    if (currentStatus === 'pending') nextStatus = 'preparing';
    else if (currentStatus === 'preparing') nextStatus = 'ready';
    else if (currentStatus === 'ready') nextStatus = 'served';
    
    adminOrders.updateStatus(orderId, nextStatus);
    toast.success(`Order moved to ${nextStatus}`);
  }

  // Effect to simulate auto-refresh by just triggering reactivity on timeAgo
  let currentTime = $state(Date.now());
  $effect(() => {
    const interval = setInterval(() => {
      currentTime = Date.now();
    }, 30000);
    return () => clearInterval(interval);
  });

  function getTableName(id: string) {
    return MOCK_TABLES.find(t => t.id === id)?.display_name || id;
  }
</script>

<div class="h-[calc(100vh-2rem)] flex flex-col gap-4 overflow-hidden -m-4 p-4 lg:-m-8 lg:p-8">
  
  {#if $pendingWaiterCount > 0}
    <div class="bg-red-500/20 border border-red-500/50 rounded-lg p-3 flex items-center justify-between flex-shrink-0 animate-pulse-ring cursor-pointer" onclick={() => {
      const pending = $waiterRequests.find(r => r.status === 'pending');
      if(pending) waiterRequests.acknowledge(pending.id);
    }}>
      <div class="flex items-center gap-3">
        <AlertTriangle class="text-red-400" />
        <span class="text-red-200 font-medium">{$pendingWaiterCount} Waiter Request(s) Pending! Click to acknowledge.</span>
      </div>
    </div>
  {/if}

  <header class="flex-shrink-0">
    <h1 class="text-3xl font-display font-bold text-[var(--color-text-primary)]">Kitchen Display</h1>
    <p class="text-[var(--color-text-secondary)] mt-1">Real-time order management</p>
  </header>

  <div class="flex gap-4 flex-1 min-h-0 overflow-x-auto pb-4 snap-x">
    {#each columns as col}
      {@const colOrders = $ordersByStatus[col.id] || []}
      <div class="w-80 lg:w-96 flex-shrink-0 flex flex-col glass-strong rounded-xl overflow-hidden snap-center">
        <!-- Column Header -->
        <div class="p-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class={`w-3 h-3 rounded-full ${col.bg}`}></div>
            <h2 class="font-bold text-lg uppercase tracking-wide">{col.title}</h2>
          </div>
          <span class="badge bg-[var(--color-card)]">{colOrders.length}</span>
        </div>

        <!-- Order Cards -->
        <div class="flex-1 overflow-y-auto p-3 space-y-3">
          {#each colOrders.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) as order (order.id)}
            <div class="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-4 shadow-lg animate-fade-in {order.status === 'pending' ? 'border-l-4 border-l-orange-500' : ''}">
              
              <div class="flex justify-between items-start mb-3 border-b border-[var(--color-border)] pb-3">
                <div>
                  <div class="text-3xl font-display font-black text-[var(--color-brand)] leading-none">{getTableName(order.table_id)}</div>
                  <div class="text-xs text-[var(--color-text-secondary)] mt-1">#{order.id.slice(-6).toUpperCase()}</div>
                </div>
                <div class="text-right flex flex-col items-end">
                  <div class="flex items-center gap-1 text-sm font-medium {order.status === 'pending' && Date.now() - new Date(order.created_at).getTime() > 600000 ? 'text-red-400 animate-pulse' : 'text-[var(--color-text-secondary)]'}">
                    <Clock size={14} />
                    {timeAgo(order.created_at)}
                  </div>
                  {#key currentTime}
                    <!-- Force re-render for timeAgo if needed, though timeAgo updates string. Key block handles it. -->
                  {/key}
                </div>
              </div>

              <div class="space-y-2 mb-4">
                {#each (order.order_items ?? []) as item}
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex gap-2">
                      <span class="font-bold text-[var(--color-brand)] bg-[var(--color-brand)]/10 px-1.5 py-0.5 rounded text-sm">{item.quantity}x</span>
                      <div>
                        <span class="font-medium">{item.menu_item?.name ?? item.menu_item_id}</span>
                        {#if item.special_instructions}
                          <p class="text-xs text-yellow-400 bg-yellow-400/10 p-1 rounded mt-1 border border-yellow-400/20 italic">Note: {item.special_instructions}</p>
                        {/if}
                      </div>
                    </div>
                  </div>
                {/each}
              </div>

              {#if order.status !== 'served'}
                <button 
                  class="w-full py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-md
                    {order.status === 'pending' ? 'bg-orange-500 text-white hover:bg-orange-600' : 
                     order.status === 'preparing' ? 'bg-purple-500 text-white hover:bg-purple-600' : 
                     'bg-green-500 text-white hover:bg-green-600'}"
                  onclick={() => moveOrder(order.id, order.status)}
                >
                  {#if order.status === 'pending'}
                    <ChefHat size={18} /> Start Preparing
                  {:else if order.status === 'preparing'}
                    <Check size={18} /> Mark as Ready
                  {:else if order.status === 'ready'}
                    <ArrowRight size={18} /> Serve Order
                  {/if}
                </button>
              {/if}
            </div>
          {/each}
          
          {#if colOrders.length === 0}
            <div class="h-32 flex items-center justify-center text-[var(--color-text-secondary)] text-sm border-2 border-dashed border-[var(--color-border)] rounded-lg">
              No orders
            </div>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>
