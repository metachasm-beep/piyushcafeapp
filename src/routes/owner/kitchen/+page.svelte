<script lang="ts">
  import { adminOrders, ordersByStatus, waiterRequests, pendingWaiterCount } from '$lib/stores/admin';
  import { timeAgo } from '$lib/utils';
  import { toast } from 'svelte-sonner';
  import { AlertTriangle, Clock, ChefHat, Check, ArrowRight } from '@lucide/svelte';

  let { data } = $props();
  let tables = $derived(data.tables || []);

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
    return tables.find(t => t.id === id)?.display_name || id;
  }
</script>

<div class="h-[calc(100vh-2rem)] flex flex-col gap-4 overflow-hidden -m-4 p-4 lg:-m-8 lg:p-8">
  
  {#if $pendingWaiterCount > 0}
    <button type="button" class="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center justify-between flex-shrink-0 animate-pulse-ring cursor-pointer w-full shadow-sm" onclick={() => {
      const pending = $waiterRequests.find(r => r.status === 'pending');
      if(pending) waiterRequests.acknowledge(pending.id);
    }}>
      <div class="flex items-center gap-3">
        <AlertTriangle class="text-red-500" />
        <span class="text-red-700 font-semibold text-sm">{$pendingWaiterCount} Waiter Request(s) Pending! Click to acknowledge.</span>
      </div>
    </button>
  {/if}

  <header class="flex-shrink-0">
    <h1 class="text-2xl font-bold tracking-tight text-zinc-950">Kitchen Display</h1>
    <p class="text-sm text-zinc-500 mt-1">Real-time order management</p>
  </header>

  <div class="flex gap-4 flex-1 min-h-0 overflow-x-auto pb-4 snap-x">
    {#each columns as col}
      {@const colOrders = $ordersByStatus[col.id] || []}
      <div class="w-80 lg:w-96 flex-shrink-0 flex flex-col bg-zinc-50/50 border border-zinc-200 rounded-2xl overflow-hidden snap-center shadow-sm">
        <!-- Column Header -->
        <div class="p-3.5 border-b border-zinc-200 bg-white flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class={`w-2.5 h-2.5 rounded-full ${col.bg}`}></div>
            <h2 class="font-bold text-sm text-zinc-900 uppercase tracking-wider">{col.title}</h2>
          </div>
          <span class="bg-zinc-100 text-zinc-600 font-bold px-2 py-0.5 rounded-md text-xs">{colOrders.length}</span>
        </div>

        <!-- Order Cards -->
        <div class="flex-1 overflow-y-auto p-3 space-y-3">
          {#each colOrders.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) as order (order.id)}
            <div class="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm {order.status === 'pending' ? 'border-l-4 border-l-orange-500' : ''}">
              
              <div class="flex justify-between items-start mb-3 border-b border-zinc-100 pb-3">
                <div>
                  <div class="text-2xl font-black text-zinc-950 leading-none">{getTableName(order.table_id)}</div>
                  <div class="text-xs text-zinc-500 font-medium mt-1">#{order.id.slice(-6).toUpperCase()}</div>
                </div>
                <div class="text-right flex flex-col items-end">
                  <div class="flex items-center gap-1 text-xs font-semibold {order.status === 'pending' && Date.now() - new Date(order.created_at).getTime() > 600000 ? 'text-red-500 animate-pulse' : 'text-zinc-500'}">
                    <Clock size={14} />
                    {timeAgo(order.created_at)}
                  </div>
                  {#key currentTime}
                    <!-- Force re-render for timeAgo if needed, though timeAgo updates string. Key block handles it. -->
                  {/key}
                </div>
              </div>

              <div class="space-y-2.5 mb-4">
                {#each (order.order_items ?? []) as item}
                  <div class="flex items-start justify-between gap-2 text-sm">
                    <div class="flex gap-2.5">
                      <span class="font-bold text-zinc-900 bg-zinc-100 px-1.5 py-0.5 rounded-md text-xs h-fit border border-zinc-200">{item.quantity}x</span>
                      <div>
                        <span class="font-semibold text-zinc-900">{item.menu_item?.name ?? item.menu_item_id}</span>
                        {#if item.variation_name}
                          <div class="text-xs text-zinc-500 mt-0.5 flex items-center gap-1 font-medium">
                            <span class="w-1 h-1 rounded-full bg-zinc-400"></span> {item.variation_name}
                          </div>
                        {/if}
                        {#if item.addons && Array.isArray(item.addons) && item.addons.length > 0}
                          <div class="text-xs text-zinc-500 mt-0.5 flex flex-wrap items-center gap-1 font-medium">
                            <span class="w-1 h-1 rounded-full bg-zinc-300"></span> + {item.addons.map(a => a.name).join(', ')}
                          </div>
                        {/if}
                        {#if item.special_instructions}
                          <p class="text-xs text-amber-700 bg-amber-50 p-2 rounded-md mt-1.5 border border-amber-200/60 font-medium">Note: {item.special_instructions}</p>
                        {/if}
                      </div>
                    </div>
                  </div>
                {/each}
              </div>

              {#if order.status !== 'served'}
                <button 
                  class="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm
                    {order.status === 'pending' ? 'bg-orange-500 text-white hover:bg-orange-600' : 
                     order.status === 'preparing' ? 'bg-purple-600 text-white hover:bg-purple-700' : 
                     'bg-emerald-600 text-white hover:bg-emerald-700'}"
                  onclick={() => moveOrder(order.id, order.status)}
                >
                  {#if order.status === 'pending'}
                    <ChefHat size={16} /> Start Preparing
                  {:else if order.status === 'preparing'}
                    <Check size={16} /> Mark as Ready
                  {:else if order.status === 'ready'}
                    <ArrowRight size={16} /> Serve Order
                  {/if}
                </button>
              {/if}
            </div>
          {/each}
          
          {#if colOrders.length === 0}
            <div class="h-32 flex items-center justify-center text-zinc-400 text-sm font-medium border-2 border-dashed border-zinc-200 rounded-xl bg-white/50">
              No orders
            </div>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>
