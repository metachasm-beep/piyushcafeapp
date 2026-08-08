<script lang="ts">
  import { fade, slide, scale } from 'svelte/transition';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { toast } from 'svelte-sonner';
  import { 
    Bell, CreditCard, Smartphone, Banknote, CheckCircle, 
    ArrowLeft, Clock, ChefHat, Utensils, ThumbsUp, X, Star
  } from '@lucide/svelte';

  import { session } from '$lib/stores/session';
  import { adminOrders, waiterRequests } from '$lib/stores/admin';
  import { formatCurrency, timeAgo, generateUUID } from '$lib/utils';
  import { supabase } from '$lib/supabase';
  
  import StatusBadge from '$lib/components/StatusBadge.svelte';

  // State
  let orderId = $derived($session.activeOrderId);
  let order = $derived($adminOrders.find(o => o.id === orderId));
  
  let waiterCalled = $state(false);
  
  // Feedback state
  let showFeedbackModal = $state(false);
  let feedbackRating = $state(0);
  let feedbackComment = $state('');
  let feedbackSubmitting = $state(false);
  let feedbackSubmitted = $state(false);
  
  // Fetch real order status from the secure backend API
  let pollingInterval: ReturnType<typeof setInterval>;

  $effect(() => {
    if (!orderId) {
      goto(`/table/${page.params.restaurant_id}/${page.params.table_id}`);
      return;
    }

    const fetchOrderData = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (!res.ok) return;
        const data = await res.json();
        
        // Check for state changes to trigger toasts
        if (order && data.status !== order.status) {
          if (data.status === 'preparing') {
            toast.info('Chefs have started preparing your order! 👨‍🍳');
          } else if (data.status === 'ready') {
            toast.success('Your food is ready and on the way! 🔔');
          } else if (data.status === 'served') {
            toast.success('Your order has been served. Enjoy! 😊');
          }
        }
        
        // We update the global store with the real database data
        adminOrders.upsertOrder(data);
        
        if (['served', 'paid'].includes(data.status) && !feedbackSubmitted) {
          if (!sessionStorage.getItem(`feedback_${orderId}`)) {
            showFeedbackModal = true;
          }
        }
        
        if (['served', 'paid', 'cancelled'].includes(data.status)) {
          supabase.removeChannel(channel);
        }
      } catch (err) {
        console.error('Failed to fetch order status', err);
      }
    };

    // Initial fetch
    fetchOrderData();

    // Subscribe to realtime changes on this specific order
    const channel = supabase?.channel(`order-${orderId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'orders',
        filter: `id=eq.${orderId}`
      }, () => {
         fetchOrderData();
      })
      .subscribe();

    return () => { 
      supabase?.removeChannel(channel); 
    };
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
        assigned_waiter_id: null,
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

  async function submitFeedback() {
    if (feedbackRating === 0) {
      toast.error('Please select a rating');
      return;
    }
    
    feedbackSubmitting = true;
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: order?.restaurant_id,
          table_id: order?.table_id,
          order_id: order?.id,
          rating: feedbackRating,
          comment: feedbackComment
        })
      });
      
      if (!res.ok) throw new Error('Failed to submit feedback');
      
      toast.success('Thank you for your feedback! 💖');
      showFeedbackModal = false;
      feedbackSubmitted = true;
      sessionStorage.setItem(`feedback_${order?.id}`, 'true');
    } catch (e) {
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      feedbackSubmitting = false;
    }
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

{#snippet dietaryIcon(tags: string[])}
  {#if tags?.includes('veg')}
    <span class="inline-flex items-center" title="Vegetarian">
      <svg class="w-[15px] h-[15px] ml-1.5 -mt-0.5 shrink-0" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="0.5" y="0.5" width="15" height="15" rx="2" stroke="#10B981" stroke-width="1.5"/>
        <circle cx="8" cy="8" r="4" fill="#10B981"/>
      </svg>
    </span>
  {/if}
  {#if tags?.includes('non_veg')}
    <span class="inline-flex items-center" title="Non-Vegetarian">
      <svg class="w-[15px] h-[15px] ml-1.5 -mt-0.5 shrink-0" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="0.5" y="0.5" width="15" height="15" rx="2" stroke="#B91C1C" stroke-width="1.5"/>
        <polygon points="8,4.5 12,11.5 4,11.5" fill="#B91C1C"/>
      </svg>
    </span>
  {/if}
{/snippet}


<svelte:head>
  <title>Track Order - Restaurant PWA</title>
</svelte:head>

{#if order}
  <header class="fixed top-0 inset-x-0 z-40 bg-white/80 backdrop-blur-xl border-b border-zinc-200 px-4 py-4 flex items-center gap-4">
    <button class="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-700 active:scale-95 transition-transform hover:bg-zinc-200" onclick={handleBack}>
      <ArrowLeft size={20} />
    </button>
    <div class="flex-1">
      <h1 class="font-bold text-lg text-zinc-950">Order Tracking</h1>
      <p class="text-xs font-medium text-zinc-500">#{order.id.slice(0, 8).toUpperCase()}</p>
    </div>
    <div class="px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-900 border border-zinc-200 text-sm font-bold shadow-sm">{order.table_id}</div>
  </header>

  <main class="pt-24 pb-32 px-4 space-y-6 animate-fade-in max-w-lg mx-auto">
    
    <!-- Status Tracker -->
    <section class="bg-white border border-zinc-200 p-6 rounded-3xl space-y-8 shadow-sm">
      <div class="text-center space-y-2">
        <StatusBadge status={order.status} />
        <h2 class="text-xl font-bold text-zinc-950 mt-2">
          {STAGES[currentStageIndex]?.msg || 'Order updated'}
        </h2>
      </div>

      <div class="relative pt-4">
        <!-- Connecting Line -->
        <div class="absolute top-[28px] left-6 right-6 h-1 bg-zinc-100 rounded-full z-0 overflow-hidden">
          <div class="h-full bg-[var(--brand-primary)] transition-all duration-1000 ease-in-out" style="width: {(Math.min(currentStageIndex, 3) / 3) * 100}%"></div>
        </div>

        <div class="relative z-10 flex justify-between">
          {#each STAGES.slice(0, 4) as stage, i}
            {@const isCompleted = i <= currentStageIndex}
            {@const isCurrent = i === currentStageIndex}
            <div class="flex flex-col items-center gap-2">
              <div class="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 {isCompleted ? 'bg-[var(--brand-primary)] text-white shadow-md' : 'bg-white text-zinc-400 border border-zinc-200'} {isCurrent ? 'scale-110' : ''} relative">
                {#if isCurrent}
                  <span class="absolute inset-0 rounded-full border-2 border-zinc-900 animate-ping opacity-50"></span>
                {/if}
                <stage.icon size={18} />
              </div>
              <span class="text-[10px] font-bold {isCompleted ? 'text-zinc-900' : 'text-zinc-400'} text-center w-16">
                {stage.label}
              </span>
            </div>
          {/each}
        </div>
      </div>
    </section>

    <!-- Order Summary -->
    <section class="space-y-4">
      <h3 class="font-bold text-lg text-zinc-950">Order Summary</h3>
      <div class="bg-white border border-zinc-200 rounded-2xl p-5 space-y-4 shadow-sm">
        {#each (order.order_items ?? []) as item}
          <div class="flex gap-4 items-center">
            <div class="w-14 h-14 rounded-lg bg-zinc-100 border border-zinc-200 overflow-hidden flex-shrink-0">
              <img src={item.menu_item.image_url} alt={item.menu_item.name} class="w-full h-full object-cover" />
            </div>
            <div class="flex-1">
              <h4 class="font-semibold text-zinc-900 text-sm flex items-center">{item.menu_item.name} {@render dietaryIcon(item.menu_item.dietary_tags)}</h4>
              {#if item.variation_name}
                <div class="text-[10px] font-medium text-zinc-500 mt-0.5">{item.variation_name}</div>
              {/if}
              {#if item.addons && Array.isArray(item.addons) && item.addons.length > 0}
                <div class="text-[10px] font-medium text-zinc-500 mt-0.5">+ {item.addons.map(a => a.name).join(', ')}</div>
              {/if}
              <p class="text-xs font-semibold text-zinc-600 mt-1">Qty: {item.quantity}</p>
            </div>
            <div class="text-zinc-900 font-bold text-sm">
              {formatCurrency(item.unit_price * item.quantity)}
            </div>
          </div>
        {/each}

        {#if order.special_notes}
          <div class="p-3 bg-amber-50 rounded-xl border border-amber-200">
            <p class="text-xs text-amber-700 font-medium"><span class="font-bold text-amber-900">Notes:</span> {order.special_notes}</p>
          </div>
        {/if}

        <div class="pt-4 border-t border-zinc-100 space-y-2">
          <div class="flex justify-between text-sm font-medium text-zinc-500">
            <span>Subtotal</span>
            <span>{formatCurrency(order.total_amount)}</span>
          </div>
          <div class="flex justify-between text-lg font-bold text-zinc-950 pt-2">
            <span>Total</span>
            <span>{formatCurrency(order.total_amount)}</span>
          </div>
        </div>
      </div>
    </section>
  </main>

  <!-- Bottom Actions -->
  <div class="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-xl border-t border-zinc-200 p-4 z-40 max-w-lg mx-auto shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
    <div class="flex gap-3">
      <button 
        class="w-14 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-700 active:scale-95 transition-transform hover:bg-zinc-50 shadow-sm"
        onclick={handleCallWaiter}
      >
        <Bell size={20} class={waiterCalled ? 'text-[var(--brand-primary)] animate-pulse' : ''} />
      </button>
      <button class="flex-1 bg-zinc-100 text-zinc-500 font-semibold rounded-xl border border-zinc-200 py-4 opacity-70 cursor-not-allowed flex justify-center items-center gap-2">
        <CheckCircle size={20} /> Order Confirmed
      </button>
    </div>
  </div>


{:else}
  <div class="h-screen flex items-center justify-center flex-col gap-4">
    <div class="w-8 h-8 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
    <p class="text-sm font-medium text-zinc-500">Loading your order...</p>
  </div>
{/if}

<!-- Feedback Modal -->
{#if showFeedbackModal}
  <div class="fixed inset-0 z-[60] flex items-center justify-center px-4" transition:fade={{ duration: 200 }}>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm" onclick={() => !feedbackSubmitting && (showFeedbackModal = false)}></div>
    
    <div class="bg-white border border-zinc-200 w-full max-w-sm rounded-3xl p-8 relative z-10 flex flex-col items-center text-center space-y-6 shadow-xl">
      <button class="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 transition-colors" onclick={() => showFeedbackModal = false} disabled={feedbackSubmitting}>
        <X size={20} />
      </button>
      
      <div class="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-900 mb-2">
        <ThumbsUp size={32} />
      </div>
      
      <div>
        <h3 class="text-2xl font-bold text-zinc-950 mb-2 tracking-tight">How was your meal?</h3>
        <p class="text-sm font-medium text-zinc-500">We'd love to hear your feedback to improve our service.</p>
      </div>

      <div class="flex gap-2 justify-center w-full">
        {#each [1, 2, 3, 4, 5] as star}
          <button 
            class="text-4xl transition-transform active:scale-90 {feedbackRating >= star ? 'text-amber-400' : 'text-zinc-200'}"
            onclick={() => feedbackRating = star}
          >
            <Star fill={feedbackRating >= star ? 'currentColor' : 'none'} strokeWidth={1.5} size={40} />
          </button>
        {/each}
      </div>

      <textarea 
        class="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all resize-none h-24"
        placeholder="Any comments or suggestions? (Optional)"
        bind:value={feedbackComment}
      ></textarea>

      <button 
        class="w-full flex justify-center items-center py-4 rounded-xl font-bold bg-[var(--brand-primary)] text-white hover:bg-zinc-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-lg"
        onclick={submitFeedback}
        disabled={feedbackSubmitting}
      >
        {feedbackSubmitting ? 'Submitting...' : 'Submit Feedback'}
      </button>
      
      <button class="text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors" onclick={() => showFeedbackModal = false}>
        Maybe later
      </button>
    </div>
  </div>
{/if}
