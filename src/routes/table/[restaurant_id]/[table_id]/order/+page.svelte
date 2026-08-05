<script lang="ts">
  import { fade, slide, scale } from 'svelte/transition';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { toast } from 'svelte-sonner';
  import { 
    Bell, CreditCard, Smartphone, Banknote, CheckCircle, 
    ArrowLeft, Clock, ChefHat, Utensils, ThumbsUp, X
  } from '@lucide/svelte';

  import { session } from '$lib/stores/session';
  import { adminOrders, waiterRequests } from '$lib/stores/admin';
  import { formatCurrency, timeAgo, generateUUID } from '$lib/utils';
  
  import StatusBadge from '$lib/components/StatusBadge.svelte';

  // State
  let orderId = $derived($session.activeOrderId);
  let order = $derived($adminOrders.find(o => o.id === orderId));
  
  let waiterCalled = $state(false);
  
  // Real-time Simulation
  let simulationInterval: ReturnType<typeof setInterval>;

  $effect(() => {
    if (!orderId) {
      goto(`/table/${page.params.restaurant_id}/${page.params.table_id}`);
      return;
    }

    // Simulate order progression for demo purposes
    simulationInterval = setInterval(() => {
      const currentOrder = $adminOrders.find(o => o.id === orderId);
      if (!currentOrder) return;
      
      if (currentOrder.status === 'pending') {
        adminOrders.updateStatus(orderId!, 'preparing');
        toast.info('Chefs have started preparing your order! 👨‍🍳');
      } else if (currentOrder.status === 'preparing') {
        adminOrders.updateStatus(orderId!, 'ready');
        toast.success('Your food is ready and on the way! 🔔');
      } else if (currentOrder.status === 'ready') {
        adminOrders.updateStatus(orderId!, 'served');
        toast.success('Your order has been served. Enjoy! 😊');
        clearInterval(simulationInterval);
      }
    }, 15000);

    return () => { if (simulationInterval) clearInterval(simulationInterval); };
  });

  function handleCallWaiter() {
    if (waiterCalled) return;
    if (order) {
      waiterRequests.add({
        id: generateUUID(),
        restaurant_id: order.restaurant_id,
        table_id: order.table_id,
        order_id: order.id,
        status: 'pending',
        message: 'Check on order',
        acknowledged_at: null,
        resolved_at: null,
        created_at: new Date().toISOString()
      });
      waiterCalled = true;
      toast.success('Waiter called!');
      setTimeout(() => waiterCalled = false, 60000);
    }
  }



  function handleBack() {
    if (order && !['served', 'paid', 'cancelled'].includes(order.status)) {
      if (!confirm('Your order is still active. Return to menu?')) return;
    }
    goto(`/table/${page.params.restaurant_id}/${page.params.table_id}`);
  }

  const STAGES = [
    { id: 'pending', label: 'Order Placed', icon: Clock, msg: 'Your order has been received! 🎉 Sit back and relax.' },
    { id: 'preparing', label: 'Preparing', icon: ChefHat, msg: 'Our chefs are working on your order 👨‍🍳' },
    { id: 'ready', label: 'Ready!', icon: Utensils, msg: 'Your food is ready! 🔔 A waiter will bring it.' },
    { id: 'served', label: 'Served', icon: ThumbsUp, msg: 'Enjoy your meal! 😊' }
  ];

  let currentStageIndex = $derived(
    !order ? 0 : Math.max(0, STAGES.findIndex(s => s.id === order.status))
  );
</script>

<svelte:head>
  <title>Track Order - Restaurant PWA</title>
</svelte:head>

{#if order}
  <header class="fixed top-0 inset-x-0 z-40 bg-black/60 backdrop-blur-xl border-b border-white/5 px-4 py-4 flex items-center gap-4">
    <button class="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-white active:scale-95" onclick={handleBack}>
      <ArrowLeft size={20} />
    </button>
    <div class="flex-1">
      <h1 class="font-display text-lg font-bold text-white">Order Tracking</h1>
      <p class="text-xs text-text-secondary">#{order.id.slice(0, 8).toUpperCase()}</p>
    </div>
    <div class="badge bg-brand/20 text-brand border-brand/30">{order.table_id}</div>
  </header>

  <main class="pt-24 pb-32 px-4 space-y-6 animate-fade-in max-w-lg mx-auto">
    
    <!-- Status Tracker -->
    <section class="glass p-6 rounded-3xl space-y-8">
      <div class="text-center space-y-2">
        <StatusBadge status={order.status} />
        <h2 class="text-xl font-display font-bold text-white mt-2">
          {STAGES[currentStageIndex]?.msg || 'Order updated'}
        </h2>
      </div>

      <div class="relative pt-4">
        <!-- Connecting Line -->
        <div class="absolute top-[28px] left-6 right-6 h-1 bg-surface-light rounded-full z-0 overflow-hidden">
          <div class="h-full bg-brand transition-all duration-1000 ease-in-out" style="width: {(Math.min(currentStageIndex, 3) / 3) * 100}%"></div>
        </div>

        <div class="relative z-10 flex justify-between">
          {#each STAGES.slice(0, 4) as stage, i}
            {@const isCompleted = i <= currentStageIndex}
            {@const isCurrent = i === currentStageIndex}
            <div class="flex flex-col items-center gap-2">
              <div class="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 {isCompleted ? 'bg-brand text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'bg-surface text-text-secondary border border-white/10'} {isCurrent ? 'scale-110' : ''} relative">
                {#if isCurrent}
                  <span class="absolute inset-0 rounded-full border-2 border-brand animate-ping opacity-50"></span>
                {/if}
                <stage.icon size={18} />
              </div>
              <span class="text-[10px] font-medium {isCompleted ? 'text-white' : 'text-text-secondary'} text-center w-16">
                {stage.label}
              </span>
            </div>
          {/each}
        </div>
      </div>
    </section>

    <!-- Order Summary -->
    <section class="space-y-4">
      <h3 class="font-display font-semibold text-lg text-white">Order Summary</h3>
      <div class="glass rounded-2xl p-4 space-y-4">
        {#each (order.order_items ?? []) as item}
          <div class="flex gap-4 items-center">
            <div class="w-14 h-14 rounded-lg bg-surface overflow-hidden flex-shrink-0">
              <img src={item.menu_item.image_url} alt={item.menu_item.name} class="w-full h-full object-cover" />
            </div>
            <div class="flex-1">
              <h4 class="font-medium text-white text-sm">{item.menu_item.name}</h4>
              <p class="text-xs text-text-secondary">Qty: {item.quantity}</p>
            </div>
            <div class="text-brand font-semibold text-sm">
              {formatCurrency(item.menu_item.price * item.quantity)}
            </div>
          </div>
        {/each}

        {#if order.special_notes}
          <div class="p-3 bg-surface/50 rounded-xl border border-white/5">
            <p class="text-xs text-text-secondary"><span class="font-medium text-white">Notes:</span> {order.special_notes}</p>
          </div>
        {/if}

        <div class="pt-4 border-t border-white/5 space-y-2">
          <div class="flex justify-between text-sm text-text-secondary">
            <span>Subtotal</span>
            <span>{formatCurrency(order.total_amount)}</span>
          </div>
          <div class="flex justify-between text-lg font-bold text-white pt-2">
            <span>Total</span>
            <span class="text-brand">{formatCurrency(order.total_amount)}</span>
          </div>
        </div>
      </div>
    </section>
  </main>

  <!-- Bottom Actions -->
  <div class="fixed bottom-0 inset-x-0 bg-black/80 backdrop-blur-xl border-t border-white/10 p-4 z-40 max-w-lg mx-auto">
    <div class="flex gap-3">
      <button 
        class="w-14 rounded-xl glass-strong flex items-center justify-center text-white active:scale-95 transition-transform"
        onclick={handleCallWaiter}
      >
        <Bell size={20} class={waiterCalled ? 'text-brand animate-pulse' : ''} />
      </button>
      <button class="flex-1 bg-surface-light text-white font-medium rounded-xl border border-white/10 py-4 opacity-70 cursor-not-allowed flex justify-center items-center gap-2">
        <CheckCircle size={20} /> Order Confirmed
      </button>
    </div>
  </div>


{:else}
  <div class="h-screen flex items-center justify-center flex-col gap-4">
    <div class="w-8 h-8 border-2 border-brand/20 border-t-brand rounded-full animate-spin"></div>
    <p class="text-text-secondary">Loading your order...</p>
  </div>
{/if}
