<script lang="ts">
  import { adminOrders, ordersByStatus, waiterRequests, pendingWaiterCount } from '$lib/stores/admin';
  import { timeAgo } from '$lib/utils';
  import { toast } from 'svelte-sonner';
  import { deserialize } from '$app/forms';
  import { AlertTriangle, Clock, ChefHat, Check, ArrowRight } from 'lucide-svelte';

  let { data } = $props();
  let tables = $derived(data.tables || []);

  // Columns definition (Dark Mode)
  const columns = [
    { id: 'pending', title: 'New Orders', color: 'orange', bg: 'bg-orange-500' },
    { id: 'preparing', title: 'Preparing', color: 'purple', bg: 'bg-purple-500' },
    { id: 'ready', title: 'Ready for Pickup', color: 'emerald', bg: 'bg-emerald-500' },
    { id: 'served', title: 'Served', color: 'zinc', bg: 'bg-zinc-600' }
  ] as const;

  async function moveOrder(orderId: string, currentStatus: string) {
    let nextStatus: 'preparing' | 'ready' | 'served' | 'cancelled' = 'preparing';
    if (currentStatus === 'pending') nextStatus = 'preparing';
    else if (currentStatus === 'preparing') nextStatus = 'ready';
    else if (currentStatus === 'ready') nextStatus = 'served';
    
    // Optimistic update for instant UI response
    adminOrders.updateStatus(orderId, nextStatus);
    
    const formData = new FormData();
    formData.append('order_id', orderId);
    formData.append('status', nextStatus);

    try {
      const response = await fetch('?/updateOrderStatus', {
        method: 'POST',
        body: formData,
        headers: { 'x-sveltekit-action': 'true' }
      });
      
      const result = deserialize(await response.text()) as any;
      if (result.type === 'success' && result.data?.success) {
        toast.success(`Order progressed to ${nextStatus.toUpperCase()}`);
      } else {
        toast.error(result.data?.message || 'Failed to update order status');
        adminOrders.updateStatus(orderId, currentStatus as any);
      }
    } catch (e) {
      toast.error('Network error');
      adminOrders.updateStatus(orderId, currentStatus as any);
    }
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
    return tables.find((t: any) => t.id === id)?.display_name || id;
  }

  // Swipe Action for GPU-Accelerated Swipe-to-Resolve
  function swipeable(node: HTMLElement, { onSwipeRight }: { onSwipeRight: () => void }) {
    let startX = 0;
    let currentX = 0;
    
    function handleTouchStart(e: TouchEvent) {
      startX = e.touches[0].clientX;
      node.style.transition = 'none';
    }
    
    function handleTouchMove(e: TouchEvent) {
      currentX = e.touches[0].clientX - startX;
      if (currentX > 0 && currentX < 150) {
        node.style.transform = `translateX(${currentX}px)`;
        node.style.opacity = `${1 - (currentX / 200)}`;
      }
    }
    
    function handleTouchEnd() {
      node.style.transition = 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease';
      if (currentX > 100) {
        onSwipeRight();
      } else {
        node.style.transform = '';
        node.style.opacity = '1';
      }
      currentX = 0;
    }
    
    node.addEventListener('touchstart', handleTouchStart, { passive: true });
    node.addEventListener('touchmove', handleTouchMove, { passive: true });
    node.addEventListener('touchend', handleTouchEnd);
    
    return {
      destroy() {
        node.removeEventListener('touchstart', handleTouchStart);
        node.removeEventListener('touchmove', handleTouchMove);
        node.removeEventListener('touchend', handleTouchEnd);
      }
    }
  }
</script>

<svelte:head>
  <title>Terminal | Kitchen Display</title>
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

<!-- Full Bleed Dark Mode Override -->
<div class="fixed inset-0 top-[60px] lg:left-[260px] lg:top-0 bg-zinc-950 text-zinc-300 font-mono z-50 overflow-hidden flex flex-col p-4 md:p-6 lg:p-8">
  
  {#if $pendingWaiterCount > 0}
    <button type="button" class="bg-red-950 border border-red-900 rounded-none p-3 flex items-center justify-between flex-shrink-0 cursor-pointer w-full shadow-sm mb-4" onclick={() => {
      const pending = $waiterRequests.find(r => r.status === 'pending');
      if(pending) waiterRequests.acknowledge(pending.id);
    }}>
      <div class="flex items-center gap-3">
        <AlertTriangle class="text-red-500 animate-pulse" />
        <span class="text-red-400 font-bold text-xs uppercase tracking-widest">{$pendingWaiterCount} Waiter Request(s) Pending! Click to acknowledge.</span>
      </div>
    </button>
  {/if}

  <header class="flex-shrink-0 flex items-center gap-4 mb-6 border-b border-zinc-900 pb-4">
    <div class="w-12 h-12 bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-100">
      <ChefHat size={24} />
    </div>
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-white uppercase">Terminal [Kitchen]</h1>
      <p class="text-xs text-zinc-500 mt-0.5 tracking-widest uppercase">KDS Active</p>
    </div>
  </header>

  <div class="flex gap-4 flex-1 min-h-0 overflow-x-auto pb-4 snap-x hide-scrollbar">
    {#each columns as col}
      {@const colOrders = $ordersByStatus[col.id] || []}
      <div class="w-80 lg:w-[360px] flex-shrink-0 flex flex-col bg-zinc-900/50 border border-zinc-900 overflow-hidden snap-center">
        <!-- Column Header -->
        <div class="p-3 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class={`w-2 h-2 rounded-full ${col.bg}`}></div>
            <h2 class="font-bold text-xs text-white uppercase tracking-widest">{col.title}</h2>
          </div>
          <span class="bg-zinc-800 text-zinc-400 font-bold px-2 py-0.5 text-[10px] border border-zinc-700">{colOrders.length}</span>
        </div>

        <!-- Order Cards -->
        <div class="flex-1 overflow-y-auto p-3 space-y-3 hide-scrollbar">
          {#each colOrders.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) as order (order.id)}
            <div class="relative overflow-hidden group">
              <!-- Swipe action background indicator -->
              {#if order.status !== 'served'}
                <div class="absolute inset-0 bg-blue-900 border border-blue-800 flex items-center px-6">
                  <Check class="text-blue-400" />
                  <span class="ml-2 font-bold text-blue-400 text-xs tracking-widest uppercase">Progress</span>
                </div>
              {/if}

              <!-- Swipeable Card -->
              <div 
                use:swipeable={{ onSwipeRight: () => { if(order.status !== 'served') moveOrder(order.id, order.status); } }}
                class="relative bg-zinc-900 border border-zinc-800 p-4 will-change-transform z-10 touch-pan-y 
                {order.status === 'pending' ? 'border-l-[3px] border-l-orange-500' : ''}"
              >
                <div class="flex justify-between items-start mb-3 border-b border-zinc-800 pb-3">
                  <div>
                    <div class="text-lg font-bold text-white leading-none uppercase">{getTableName(order.table_id)}</div>
                    <div class="text-[10px] text-zinc-500 font-bold mt-1 tracking-widest">#{order.id.slice(-6).toUpperCase()}</div>
                  </div>
                  <div class="text-right flex flex-col items-end">
                    <div class="flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase {order.status === 'pending' && Date.now() - new Date(order.created_at).getTime() > 600000 ? 'text-red-500 animate-pulse' : 'text-zinc-500'}">
                      <Clock size={12} />
                      {timeAgo(order.created_at)}
                    </div>
                    {#key currentTime}
                      <!-- Force re-render for timeAgo if needed -->
                    {/key}
                  </div>
                </div>

                <div class="space-y-3 mb-4">
                  {#each (order.order_items ?? []) as item}
                    <div class="flex items-start justify-between gap-3 text-sm">
                      <div class="flex gap-3">
                        <span class="font-bold text-zinc-900 bg-zinc-300 px-1.5 py-0.5 h-fit text-xs border border-zinc-400">{item.quantity}x</span>
                        <div>
                          <span class="font-bold text-zinc-200">{item.menu_item?.name ?? item.menu_item_id}</span>
                          {#if item.variation_name}
                            <div class="text-[10px] text-zinc-500 mt-1 flex items-center gap-1.5 font-bold uppercase tracking-widest">
                              <span class="w-1 h-1 bg-zinc-600"></span> {item.variation_name}
                            </div>
                          {/if}
                          {#if item.addons && Array.isArray(item.addons) && item.addons.length > 0}
                            <div class="text-[10px] text-zinc-500 mt-1 flex flex-wrap items-center gap-1.5 font-bold uppercase tracking-widest">
                              <span class="w-1 h-1 bg-zinc-600"></span> + {item.addons.map(a => a.name).join(', ')}
                            </div>
                          {/if}
                          {#if item.special_instructions}
                            <p class="text-[10px] text-orange-400 bg-orange-950/30 p-2 mt-2 border border-orange-900/50 font-bold uppercase tracking-widest">NOTE: {item.special_instructions}</p>
                          {/if}
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>

                {#if order.status !== 'served'}
                  <button 
                    class="hidden md:flex w-full py-2.5 text-[10px] font-bold uppercase tracking-widest items-center justify-center gap-2 transition-colors border
                      {order.status === 'pending' ? 'bg-orange-950 text-orange-400 border-orange-900 hover:bg-orange-900' : 
                       order.status === 'preparing' ? 'bg-purple-950 text-purple-400 border-purple-900 hover:bg-purple-900' : 
                       'bg-emerald-950 text-emerald-400 border-emerald-900 hover:bg-emerald-900'}"
                    onclick={() => moveOrder(order.id, order.status)}
                  >
                    {#if order.status === 'pending'}
                      <ChefHat size={14} /> Start Preparing
                    {:else if order.status === 'preparing'}
                      <Check size={14} /> Mark as Ready
                    {:else if order.status === 'ready'}
                      <ArrowRight size={14} /> Serve Order
                    {/if}
                  </button>
                  <div class="mt-3 md:hidden">
                    <p class="text-[10px] text-zinc-600 font-bold uppercase tracking-widest flex items-center gap-1">
                      <span class="animate-pulse-ring h-1 w-1 bg-zinc-500 rounded-full inline-block"></span> Swipe right to progress
                    </p>
                  </div>
                {/if}
              </div>
            </div>
          {/each}
          
          {#if colOrders.length === 0}
            <div class="h-32 flex items-center justify-center text-zinc-600 text-[10px] uppercase tracking-widest font-bold border border-dashed border-zinc-800 bg-zinc-900/30">
              No Orders
            </div>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>
