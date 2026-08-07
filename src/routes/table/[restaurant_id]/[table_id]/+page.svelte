<script lang="ts">
  import { fade, fly, slide } from 'svelte/transition';
  import { ShoppingCart, Bell, Plus, Minus, X, Smartphone, CreditCard, Banknote } from '@lucide/svelte';
  import { toast } from 'svelte-sonner';
  import { goto } from '$app/navigation';
  
  import { session } from '$lib/stores/session';
  // Order placement is now handled through the secure /api/orders endpoint
  import { cart, cartCount, cartTotal } from '$lib/stores/cart';
  import { adminOrders, waiterRequests } from '$lib/stores/admin';
  import { formatCurrency, generateUUID } from '$lib/utils';
  
  import DietaryBadge from '$lib/components/DietaryBadge.svelte';
  import type { PageData } from './$types';
  import type { Order, OrderItemWithMenuItem } from '$lib/types';

  let { data }: { data: PageData } = $props();
  let restaurant = $derived(data.restaurant);
  let table = $derived(data.table);
  let categories = $derived(data.categories);
  let menuItems = $derived(data.menuItems);

  // Initialize session
  $effect(() => {
    session.init(restaurant, table);
  });

  let activeCategory = $state('all');
  let isCartOpen = $state(false);
  let showCheckoutModal = $state(false);
  let paymentMethod = $state<'upi'|'card'|'cash'>('upi');
  let isProcessingPayment = $state(false);
  let specialInstructions = $state('');
  
  let waiterCalled = $state(false);
  let waiterCooldown = $state(false);
  
  // Derived state
  let featuredItems = $derived(menuItems.filter(item => item.is_featured && item.is_available));
  let itemsByCategory = $derived(() => {
    const grouped = new Map();
    for (const cat of categories) {
      grouped.set(cat.id, menuItems.filter(item => item.category_id === cat.id));
    }
    return grouped;
  });

  function scrollToCategory(catId: string) {
    activeCategory = catId;
    if (catId === 'all') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(`category-${catId}`);
    if (el) {
      const headerOffset = 120;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }

  function handleCallWaiter() {
    if (waiterCooldown) {
      toast('Waiter is already on the way!');
      return;
    }
    waiterRequests.add({
      id: generateUUID(),
      restaurant_id: restaurant.id,
      table_id: table.id,
      order_id: null,
      status: 'pending',
      message: 'Customer requires assistance',
      acknowledged_at: null,
      resolved_at: null,
      created_at: new Date().toISOString(),
      table
    });
    toast.success('Waiter called! 🛎️ Someone will be with you shortly.');
    waiterCalled = true;
    waiterCooldown = true;
    setTimeout(() => { waiterCalled = false; }, 3000);
    setTimeout(() => { waiterCooldown = false; }, 60000);
  }

  function placeOrder() {
    if ($cartCount === 0) return;
    showCheckoutModal = true;
    isCartOpen = false;
  }

  async function handlePayment() {
    isProcessingPayment = true;
    
    try {
      const items = $cart.map(c => ({
        menu_item_id: c.menu_item.id,
        quantity: c.quantity,
        subtotal: c.menu_item.price * c.quantity
      }));
      
      const currentCartTotal = $cartTotal; // Save before clearing
      
      // Route through the secure server API endpoint (Zod-validated, saga-rollback enabled)
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: restaurant.id,
          table_id: table.id,
          special_instructions: specialInstructions,
          items
        })
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.error ?? `Server error ${res.status}`);
      }

      const { orderId } = await res.json();
      session.setActiveOrder(orderId);
      cart.clear();
      showCheckoutModal = false;

      if (paymentMethod === 'cash') {
        toast.success('Order placed successfully! 🎉 Waiter will collect cash.');
        goto(`/table/${restaurant.id}/${table.id}/order`);
      } else {
        toast.info('Initializing payment...');
        
        const rzpRes = await fetch('/api/razorpay/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: currentCartTotal * 1.1,
            restaurant_id: restaurant.id,
            receipt: `rcpt_${orderId}`,
            notes: { internal_order_id: orderId }
          })
        });

        if (!rzpRes.ok) throw new Error('Failed to initialize payment gateway.');
        const rzpData = await rzpRes.json();
        
        const options = {
          key: rzpData.key || 'dummy_key',
          amount: rzpData.amount,
          currency: rzpData.currency,
          name: restaurant.name,
          description: `Order ${orderId}`,
          order_id: rzpData.id,
          handler: function (response: any) {
             toast.success('Payment successful! 🎉');
             isProcessingPayment = false;
             goto(`/table/${restaurant.id}/${table.id}/order`);
          },
          prefill: {
             name: 'Customer',
             email: 'customer@example.com',
             contact: '9999999999'
          },
          theme: {
             color: '#f97316' // brand orange
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
             toast.error(response.error.description || 'Payment failed');
             isProcessingPayment = false;
        });
        rzp.open();
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to place order. Please try again.';
      toast.error(msg);
      isProcessingPayment = false;
    }
  }
  
  function getCartItemQuantity(itemId: string) {
    return $cart.find(i => i.menu_item.id === itemId)?.quantity || 0;
  }
</script>

<svelte:head>
  <title>{restaurant.name} - Menu</title>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
</svelte:head>

<!-- Sticky Header -->
<header class="fixed top-0 left-0 right-0 z-40 bg-bg/90 backdrop-blur-xl border-b border-border/50">
  <div class="px-4 py-4 flex items-center justify-between">
    <div class="flex items-center gap-3">
      {#if restaurant.logo_url}
        <img src={restaurant.logo_url} alt={restaurant.name} class="w-10 h-10 rounded-lg object-cover border border-border/50" />
      {/if}
      <div class="flex flex-col">
        <h1 class="font-display text-2xl font-bold tracking-tight text-text-primary">
          {restaurant.name}<span class="text-brand">.</span>
        </h1>
        <p class="text-xs text-text-secondary uppercase tracking-widest mt-0.5">Welcome</p>
      </div>
    </div>
    <div class="badge border-brand/30 bg-brand/10 text-brand font-semibold px-3 py-1 shadow-[0_0_10px_rgba(249,115,22,0.2)]">
      {table.display_name ?? `Table ${table.table_number}`}
    </div>
  </div>
  
  <!-- Category Filter Bar -->
  <div class="flex overflow-x-auto hide-scrollbar px-4 py-2 gap-2 border-t border-white/5 scroll-smooth" style="-webkit-overflow-scrolling: touch;">
    <button 
      class="cat-pill whitespace-nowrap px-4 py-2 rounded-full font-medium transition-colors {activeCategory === 'all' ? 'bg-brand text-black' : 'bg-surface text-text-secondary border border-border hover:bg-card'}"
      onclick={() => scrollToCategory('all')}
    >
      🍽️ All
    </button>
    {#each categories as category}
      <button 
        class="cat-pill whitespace-nowrap px-4 py-2 rounded-full font-medium transition-colors {activeCategory === category.id ? 'bg-brand text-black' : 'bg-surface text-text-secondary border border-border hover:bg-card'}"
        onclick={() => scrollToCategory(category.id)}
      >
        {category.icon_emoji} {category.name}
      </button>
    {/each}
  </div>
</header>

<main class="pt-32 pb-32 px-4 space-y-8 animate-fade-in">
  
  <!-- Featured Section -->
  {#if featuredItems.length > 0 && activeCategory === 'all'}
    <section class="space-y-3">
      <h2 class="font-display text-lg font-bold flex items-center gap-2 text-text-primary">
        ✨ Featured
      </h2>
      <div class="flex overflow-x-auto hide-scrollbar gap-4 pb-2">
        {#each featuredItems as item}
          <div class="glass flex-none w-[280px] p-3 rounded-2xl flex flex-col gap-3 relative overflow-hidden group">
            <div class="w-full h-32 rounded-xl bg-surface overflow-hidden relative">
              <img src={item.image_url} alt={item.name} class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
              <div class="absolute top-2 left-2 flex gap-1">
                {#each item.dietary_tags as tag}
                  <DietaryBadge {tag} />
                {/each}
              </div>
            </div>
            <div class="flex flex-col gap-1 flex-1">
              <h3 class="font-display font-semibold text-lg text-text-primary leading-tight">{item.name}</h3>
              <p class="text-xs text-text-secondary line-clamp-2">{item.description}</p>
            </div>
            <div class="flex items-center justify-between mt-auto pt-2">
              <span class="text-brand font-bold">{formatCurrency(item.price)}</span>
              {#if getCartItemQuantity(item.id) > 0}
                <div class="flex items-center gap-2 bg-surface rounded-full p-1 border border-border">
                  <button class="w-7 h-7 rounded-full bg-surface-light flex items-center justify-center text-text-primary active:scale-95 transition-transform" onclick={() => cart.setQuantity(item.id, getCartItemQuantity(item.id) - 1)}>
                    <Minus size={14} />
                  </button>
                  <span class="w-4 text-center font-medium text-sm">{getCartItemQuantity(item.id)}</span>
                  <button class="w-7 h-7 rounded-full bg-brand flex items-center justify-center text-text-primary active:scale-95 transition-transform" onclick={() => cart.setQuantity(item.id, getCartItemQuantity(item.id) + 1)}>
                    <Plus size={14} />
                  </button>
                </div>
              {:else}
                <button class="w-8 h-8 rounded-full bg-brand/20 text-brand flex items-center justify-center hover:bg-brand hover:text-text-primary transition-colors active:scale-95" onclick={() => cart.addItem(item, 1)}>
                  <Plus size={18} />
                </button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </section>
  {/if}

  <!-- Menu Grid Grouped by Category -->
  {#each categories as category}
    {@const items = itemsByCategory().get(category.id) || []}
    {#if items.length > 0 && (activeCategory === 'all' || activeCategory === category.id)}
      <section id="category-{category.id}" class="space-y-4 scroll-mt-32">
        <h2 class="font-display text-xl font-bold flex items-center gap-2 border-b border-border pb-2 text-text-primary">
          {category.icon_emoji} {category.name}
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          {#each items as item}
            <div class="glass p-3 rounded-2xl flex gap-4 relative overflow-hidden group {item.is_available ? '' : 'opacity-60 grayscale'}">
              {#if !item.is_available}
                <div class="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                  <span class="bg-black/80 text-text-primary px-3 py-1.5 rounded-lg text-sm font-semibold tracking-wider">OUT OF STOCK</span>
                </div>
              {/if}
              <div class="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 rounded-xl bg-surface overflow-hidden relative">
                <img src={item.image_url} alt={item.name} class="w-full h-full object-cover" loading="lazy" />
              </div>
              <div class="flex flex-col flex-1 py-1">
                <div class="flex gap-1 mb-1.5 flex-wrap">
                  {#each item.dietary_tags as tag}
                    <DietaryBadge {tag} />
                  {/each}
                </div>
                <h3 class="font-display font-semibold text-text-primary leading-tight mb-1">{item.name}</h3>
                <p class="text-xs text-text-secondary line-clamp-2 mb-2">{item.description}</p>
                <div class="mt-auto flex items-center justify-between">
                  <div class="flex flex-col">
                    <span class="text-brand font-bold">{formatCurrency(item.price)}</span>
                    {#if item.preparation_time}
                      <span class="text-[10px] text-text-secondary flex items-center gap-1">
                        ⏱ {item.preparation_time} mins
                      </span>
                    {/if}
                  </div>
                  {#if item.is_available}
                    {#if getCartItemQuantity(item.id) > 0}
                      <div class="flex items-center gap-2 bg-surface rounded-full p-1 border border-border z-20">
                        <button class="w-6 h-6 rounded-full bg-surface-light flex items-center justify-center text-text-primary active:scale-95 transition-transform" onclick={() => cart.setQuantity(item.id, getCartItemQuantity(item.id) - 1)}>
                          <Minus size={12} />
                        </button>
                        <span class="w-3 text-center font-medium text-xs">{getCartItemQuantity(item.id)}</span>
                        <button class="w-6 h-6 rounded-full bg-brand flex items-center justify-center text-text-primary active:scale-95 transition-transform" onclick={() => cart.setQuantity(item.id, getCartItemQuantity(item.id) + 1)}>
                          <Plus size={12} />
                        </button>
                      </div>
                    {:else}
                      <button class="w-8 h-8 rounded-full bg-surface border border-border text-text-primary flex items-center justify-center z-20 active:scale-95 transition-transform" onclick={() => cart.addItem(item, 1)}>
                        <Plus size={16} />
                      </button>
                    {/if}
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        </div>
      </section>
    {/if}
  {/each}
</main>

<!-- Floating Action Buttons -->
<div class="fixed right-4 flex flex-col gap-3 z-40" style="bottom: max(24px, env(safe-area-inset-bottom, 24px));">
  <!-- Call Waiter FAB -->
  <button 
    class="w-12 h-12 rounded-full glass-strong shadow-lg flex items-center justify-center text-text-primary transition-transform active:scale-90 {waiterCalled ? 'text-brand animate-pulse-ring' : ''} {waiterCooldown && !waiterCalled ? 'opacity-50' : ''}"
    onclick={handleCallWaiter}
    title="Call Waiter"
  >
    <Bell size={22} class={waiterCalled ? 'animate-bounce' : ''} />
  </button>

  <!-- Cart FAB -->
  {#if $cartCount > 0 && !isCartOpen}
    <div transition:fly={{ y: 20, duration: 300 }}>
      <button 
        class="w-14 h-14 rounded-full bg-brand shadow-[0_4px_20px_rgba(249,115,22,0.4)] flex items-center justify-center text-text-primary transition-transform active:scale-90 relative animate-bounce-in"
        onclick={() => isCartOpen = true}
      >
        <ShoppingCart size={24} />
        <span class="absolute -top-1 -right-1 bg-white text-brand text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shadow-md border-2 border-brand">
          {$cartCount}
        </span>
      </button>
    </div>
  {/if}
</div>

<!-- Cart Panel Overlay -->
{#if isCartOpen}
  <div class="fixed inset-0 z-50 flex flex-col justify-end" transition:fade={{ duration: 200 }}>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" onclick={() => isCartOpen = false}></div>
    
    <div 
      class="bg-card w-full max-h-[85vh] rounded-t-3xl shadow-2xl relative flex flex-col overflow-hidden border-t border-border"
      transition:fly={{ y: '100%', duration: 300, opacity: 1 }}
    >
      <!-- Handle for dragging (visual only) -->
      <button type="button" aria-label="Close cart" class="w-full flex justify-center py-3" onclick={() => isCartOpen = false}>
        <div class="w-12 h-1.5 bg-white/20 rounded-full"></div>
      </button>
      
      <div class="px-6 pb-4 flex items-center justify-between border-b border-border">
        <h2 class="font-display text-2xl font-bold text-text-primary flex items-center gap-2">
          Your Order <span class="bg-brand text-text-primary text-sm px-2 py-0.5 rounded-full">{$cartCount}</span>
        </h2>
        <button class="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-text-secondary hover:text-text-primary" onclick={() => isCartOpen = false}>
          <X size={18} />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-6 space-y-6">
        <!-- Cart Items -->
        <div class="space-y-4">
          {#each $cart as item}
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 rounded-xl bg-surface overflow-hidden">
                <img src={item.menu_item.image_url} alt={item.menu_item.name} class="w-full h-full object-cover" />
              </div>
              <div class="flex-1 flex flex-col">
                <h4 class="font-medium text-text-primary">{item.menu_item.name}</h4>
                <span class="text-brand font-semibold text-sm">{formatCurrency(item.menu_item.price)}</span>
              </div>
              <div class="flex items-center gap-3 bg-surface rounded-full p-1 border border-border">
                <button class="w-7 h-7 rounded-full bg-surface-light flex items-center justify-center text-text-primary active:scale-95" onclick={() => cart.setQuantity(item.menu_item.id, item.quantity - 1)}>
                  <Minus size={14} />
                </button>
                <span class="w-4 text-center font-medium text-sm">{item.quantity}</span>
                <button class="w-7 h-7 rounded-full bg-brand flex items-center justify-center text-text-primary active:scale-95" onclick={() => cart.setQuantity(item.menu_item.id, item.quantity + 1)}>
                  <Plus size={14} />
                </button>
              </div>
            </div>
          {/each}
        </div>

        <!-- Special Instructions -->
        <div class="space-y-2">
          <label for="instructions" class="text-sm font-medium text-text-secondary flex items-center gap-1">
            📝 Special Instructions
          </label>
          <textarea 
            id="instructions" 
            bind:value={specialInstructions}
            placeholder="Any allergies or special requests?"
            class="input-dark w-full h-20 resize-none"
          ></textarea>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-6 bg-surface/50 border-t border-border space-y-4 backdrop-blur-md">
        <div class="flex justify-between text-text-secondary text-sm">
          <span>Subtotal</span>
          <span>{formatCurrency($cartTotal)}</span>
        </div>
        <div class="flex justify-between text-text-secondary text-sm">
          <span>Taxes (10%)</span>
          <span>{formatCurrency($cartTotal * 0.1)}</span>
        </div>
        <div class="flex justify-between text-text-primary font-bold text-lg pt-2 border-t border-border">
          <span>Total</span>
          <span class="text-brand">{formatCurrency($cartTotal * 1.1)}</span>
        </div>
        <button 
          class="btn-brand w-full py-4 text-lg shadow-[0_0_20px_rgba(249,115,22,0.3)] mt-2"
          onclick={placeOrder}
        >
          Place Order
        </button>
        <button 
          class="btn-ghost w-full py-3 text-text-secondary flex justify-center items-center gap-2"
          onclick={handleCallWaiter}
        >
          <Bell size={16} /> Need assistance? Call Waiter
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Checkout Modal -->
{#if showCheckoutModal}
  <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:p-0" transition:fade={{ duration: 200 }}>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="absolute inset-0 bg-black/80 backdrop-blur-md" onclick={() => !isProcessingPayment && (showCheckoutModal = false)}></div>
    
    <div class="glass w-full max-w-md rounded-3xl p-6 relative z-10 space-y-6">
      <div class="flex justify-between items-center">
        <h3 class="font-display text-xl font-bold text-text-primary">Payment</h3>
        <button class="text-text-secondary hover:text-text-primary" onclick={() => showCheckoutModal = false} disabled={isProcessingPayment}>
          <X size={20} />
        </button>
      </div>

      <div class="text-center py-4 border-b border-border">
        <p class="text-text-secondary text-sm">Amount to Pay</p>
        <p class="text-3xl font-display font-bold text-brand">{formatCurrency($cartTotal * 1.1)}</p>
      </div>

      <div class="grid grid-cols-3 gap-2">
        <button 
          class="flex flex-col items-center gap-2 p-3 rounded-xl border {paymentMethod === 'upi' ? 'bg-brand/20 border-brand text-brand' : 'bg-surface border-border text-text-secondary'}"
          onclick={() => paymentMethod = 'upi'}
        >
          <Smartphone size={20} />
          <span class="text-xs font-medium">UPI</span>
        </button>
        <button 
          class="flex flex-col items-center gap-2 p-3 rounded-xl border {paymentMethod === 'card' ? 'bg-brand/20 border-brand text-brand' : 'bg-surface border-border text-text-secondary'}"
          onclick={() => paymentMethod = 'card'}
        >
          <CreditCard size={20} />
          <span class="text-xs font-medium">Card</span>
        </button>
        <button 
          class="flex flex-col items-center gap-2 p-3 rounded-xl border {paymentMethod === 'cash' ? 'bg-brand/20 border-brand text-brand' : 'bg-surface border-border text-text-secondary'}"
          onclick={() => paymentMethod = 'cash'}
        >
          <Banknote size={20} />
          <span class="text-xs font-medium">Cash</span>
        </button>
      </div>

      <div class="min-h-[120px] flex flex-col justify-center">
        {#if paymentMethod === 'upi'}
          <div class="space-y-3">
            <label class="text-sm text-text-secondary" for="upi-input">Enter UPI ID</label>
            <input id="upi-input" type="text" class="input-dark w-full" value="goldenfork@upi" />
          </div>
        {:else if paymentMethod === 'card'}
          <div class="space-y-3">
            <input type="text" class="input-dark w-full" placeholder="Card Number" value="**** **** **** 4242" />
            <div class="flex gap-3">
              <input type="text" class="input-dark w-1/2" placeholder="MM/YY" value="12/26" />
              <input type="text" class="input-dark w-1/2" placeholder="CVV" value="***" />
            </div>
          </div>
        {:else}
          <div class="text-center text-text-secondary text-sm">
            Our waiter will come to your table to collect cash.
          </div>
        {/if}
      </div>

      <button 
        class="btn-brand w-full py-4 text-lg relative overflow-hidden flex justify-center items-center h-14"
        onclick={handlePayment}
        disabled={isProcessingPayment}
      >
        {#if isProcessingPayment}
          <div class="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
        {:else}
          {paymentMethod === 'cash' ? 'Place Order (Cash)' : 'Confirm Payment'}
        {/if}
      </button>
    </div>
  </div>
{/if}
