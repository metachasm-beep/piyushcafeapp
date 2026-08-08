<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { ShoppingCart, Bell, Plus, Minus, X, Smartphone, CreditCard, Banknote } from 'lucide-svelte';
  import { toast } from 'svelte-sonner';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  
  import { session } from '$lib/stores/session';
  import { cart, cartCount, cartTotal } from '$lib/stores/cart';
  import { formatCurrency } from '$lib/utils';
  
  import DietaryBadge from '$lib/components/DietaryBadge.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  let restaurant = $derived(data.restaurant);
  let table = $derived(data.table);
  let categories = $derived(data.categories);
  let menuItems = $derived(data.menuItems);
  let allVariations = $derived(data.variations);
  let allAddons = $derived(data.addons);

  $effect(() => { session.init(restaurant, table); });

  onMount(async () => {
    if (browser) {
      const gsap = (await import('gsap')).default;
      const ScrollTrigger = (await import('gsap/ScrollTrigger')).default;
      gsap.registerPlugin(ScrollTrigger);

      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // Hero Parallax
        gsap.to('.hero-parallax-img', {
          yPercent: 30,
          ease: 'none',
          scrollTrigger: { trigger: '.hero-container', start: 'top top', end: 'bottom top', scrub: true }
        });

        // Domino Entrances on load
        gsap.from('.featured-card', { y: 40, opacity: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out', clearProps: 'all' });
        
        // Scroll-triggered Reveals
        gsap.utils.toArray('.menu-card').forEach((card: any) => {
          gsap.from(card, {
            scrollTrigger: { trigger: card, start: 'top bottom-=50', toggleActions: 'play none none none' },
            y: 30, opacity: 0, duration: 0.5, ease: 'power2.out', clearProps: 'all'
          });
        });
      });
    }
  });

  let activeCategory = $state('all');
  let isCartOpen = $state(false);
  let showCheckoutModal = $state(false);
  let paymentMethod = $state<'upi'|'card'|'cash'>('upi');
  let isProcessingPayment = $state(false);
  let specialInstructions = $state('');
  let waiterCalled = $state(false);
  let waiterCooldown = $state(false);
  let activeItem = $state<typeof menuItems[0] | null>(null);
  let selectedVariation = $state<typeof allVariations[0] | null>(null);
  let selectedAddons = $state<typeof allAddons[0][]>([]);
  let itemModalQty = $state(1);
  
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
    if (catId === 'all') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const el = document.getElementById(`category-${catId}`);
    if (el) {
      const headerOffset = 120;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  }

  function handleCallWaiter() {
    if (waiterCooldown) { toast('Waiter is already on the way!'); return; }
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
        variation_id: c.variation?.id,
        addon_ids: c.addons.map(a => a.id),
        special_instructions: c.special_instructions
      }));
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurant_id: restaurant.id, table_id: table.id, special_instructions: specialInstructions, items })
      });
      if (!res.ok) { const errBody = await res.json().catch(() => ({})); throw new Error(errBody?.error ?? `Server error ${res.status}`); }
      const { orderId } = await res.json();
      session.setActiveOrder(orderId);
      cart.clear();
      showCheckoutModal = false;
      if (paymentMethod === 'cash') {
        toast.success('Order placed! 🎉 Waiter will collect cash.');
        goto(`/table/${restaurant.id}/${table.id}/order`);
      } else {
        toast.info('Initializing payment...');
        const rzpRes = await fetch('/api/razorpay/order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_id: orderId, receipt: `rcpt_${orderId}`, notes: { internal_order_id: orderId } }) });
        if (!rzpRes.ok) throw new Error('Failed to initialize payment gateway.');
        const rzpData = await rzpRes.json();
        const options = {
          key: rzpData.key || 'dummy_key', amount: rzpData.amount, currency: rzpData.currency,
          name: restaurant.name, description: `Order ${orderId}`, order_id: rzpData.id,
          handler: function (response: any) { toast.success('Payment successful! 🎉'); isProcessingPayment = false; goto(`/table/${restaurant.id}/${table.id}/order`); },
          prefill: { name: 'Customer', email: 'customer@example.com', contact: '9999999999' },
          theme: { color: '#09090b' }
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) { toast.error(response.error.description || 'Payment failed'); isProcessingPayment = false; });
        rzp.open();
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to place order. Please try again.';
      toast.error(msg);
      isProcessingPayment = false;
    }
  }
  
  function getTotalQuantity(itemId: string) {
    return $cart.filter(i => i.menu_item.id === itemId).reduce((sum, i) => sum + i.quantity, 0);
  }

  function handleMenuAdd(item: typeof menuItems[0]) {
    const itemVars = allVariations.filter(v => v.menu_item_id === item.id);
    const itemAddons = allAddons.filter(a => a.menu_item_id === item.id);
    if (itemVars.length === 0 && itemAddons.length === 0) {
      cart.addItem(item, 1);
    } else {
      activeItem = item;
      selectedVariation = itemVars.length > 0 ? itemVars[0] : null;
      selectedAddons = [];
      itemModalQty = 1;
    }
  }

  function confirmItemModal() {
    if (activeItem) {
      cart.addItem(activeItem, itemModalQty, '', selectedVariation, selectedAddons);
      activeItem = null;
      toast.success('Added to cart');
    }
  }
  
  function toggleAddon(addon: typeof allAddons[0]) {
    const idx = selectedAddons.findIndex(a => a.id === addon.id);
    if (idx >= 0) { selectedAddons = selectedAddons.filter(a => a.id !== addon.id); }
    else { selectedAddons = [...selectedAddons, addon]; }
  }
</script>

<svelte:head>
  <title>{restaurant.name} - Menu</title>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
</svelte:head>

<style>
  :global(body) {
    background-color: #f9fafb;
    color: #09090b;
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .hide-scrollbar::-webkit-scrollbar { display: none; }
  .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>

<!-- Sticky Header -->
<header class="fixed top-0 left-0 right-0 z-40 bg-white/60 backdrop-blur-2xl border-b border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] transition-all">
  <div class="px-4 py-3 flex items-center justify-between">
    <div class="flex items-center gap-3">
      {#if restaurant.logo_url}
        <img src={restaurant.logo_url} alt={restaurant.name} class="w-9 h-9 rounded-lg object-cover shadow-sm" />
      {/if}
      <div>
        <h1 class="font-bold text-lg tracking-tight text-zinc-950 leading-tight">{restaurant.name}</h1>
        <p class="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Menu</p>
      </div>
    </div>
    <span class="inline-flex items-center rounded-full border border-zinc-200/50 bg-zinc-900/90 backdrop-blur px-3 py-1 text-xs font-semibold text-zinc-50 shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
      {table.display_name ?? `Table ${table.table_number}`}
    </span>
  </div>
  
  <!-- Category Filter Bar -->
  <div class="flex overflow-x-auto hide-scrollbar px-4 py-2 gap-2 border-t border-zinc-200/30" style="-webkit-overflow-scrolling: touch;">
    <button 
      class="whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 {activeCategory === 'all' ? 'bg-zinc-900 text-white shadow-md' : 'bg-white/80 text-zinc-600 border border-zinc-200/50 hover:bg-white hover:shadow-sm'}"
      onclick={() => scrollToCategory('all')}
    >
      🍽️ All
    </button>
    {#each categories as category}
      <button 
        class="whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 {activeCategory === category.id ? 'bg-zinc-900 text-white shadow-md' : 'bg-white/80 text-zinc-600 border border-zinc-200/50 hover:bg-white hover:shadow-sm'}"
        onclick={() => scrollToCategory(category.id)}
      >
        {category.icon_emoji} {category.name}
      </button>
    {/each}
  </div>
</header>

<!-- Parallax Hero -->
<div class="hero-container relative w-full h-[35vh] overflow-hidden bg-zinc-900 -mt-20 z-0">
  {#if restaurant.banner_url || restaurant.logo_url}
    <img src={restaurant.banner_url || restaurant.logo_url} alt="Restaurant Banner" class="hero-parallax-img absolute inset-0 w-full h-[130%] object-cover opacity-60 origin-top" />
  {/if}
  <div class="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-900/40 to-[#f9fafb]"></div>
  <div class="absolute bottom-10 left-4 right-4 z-10 flex flex-col items-center text-center">
    <h2 class="text-3xl font-bold text-white drop-shadow-md">{restaurant.name}</h2>
    <p class="text-sm text-zinc-200 mt-1 drop-shadow">Tap the items below to order</p>
  </div>
</div>

<main class="pt-6 pb-32 px-4 space-y-8 max-w-2xl mx-auto relative z-10">
  
  <!-- Featured Section -->
  {#if featuredItems.length > 0 && activeCategory === 'all'}
    <section class="space-y-3" style="perspective: 1000px;">
      <h2 class="text-base font-semibold text-zinc-950 flex items-center gap-2">✨ Featured</h2>
      <div class="flex overflow-x-auto hide-scrollbar gap-4 pb-6 pt-2 px-1" style="transform: rotateX(5deg) rotateY(-2deg); transform-style: preserve-3d;">
        {#each featuredItems as item}
          <div class="featured-card flex-none w-[240px] rounded-2xl bg-white/90 backdrop-blur-sm overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.08)] group hover:shadow-[0_30px_60px_rgba(0,0,0,0.12)] transition-all duration-500 ease-out hover:-translate-y-2 border border-white/50">
            <div class="w-full h-32 bg-zinc-100 overflow-hidden relative">
              <img src={item.image_url} alt={item.name} class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
              <div class="absolute top-2 left-2 flex gap-1">
                {#each item.dietary_tags as tag}<DietaryBadge {tag} />{/each}
              </div>
            </div>
            <div class="p-4">
              <h3 class="font-bold text-sm text-zinc-950 leading-tight mb-1">{item.name}</h3>
              <p class="text-[11px] text-zinc-500 line-clamp-2 mb-3">{item.description}</p>
              <div class="flex items-center justify-between">
                <span class="font-bold text-[15px] text-zinc-900">{formatCurrency(item.price)}</span>
                {#if getTotalQuantity(item.id) > 0}
                  <div class="flex items-center gap-1.5 bg-zinc-100 rounded-full p-0.5 border border-zinc-200/50 shadow-inner">
                    {#if allVariations.filter(v => v.menu_item_id === item.id).length === 0 && allAddons.filter(a => a.menu_item_id === item.id).length === 0}
                      <button class="w-7 h-7 rounded-full bg-white border border-zinc-200/50 shadow-sm flex items-center justify-center transition-all duration-300 ease-out active:scale-90 hover:bg-zinc-50" onclick={() => cart.setQuantity(cart.generateCartKey(item.id), getTotalQuantity(item.id) - 1)}><Minus size={12} /></button>
                      <span class="w-4 text-center font-semibold text-xs">{getTotalQuantity(item.id)}</span>
                      <button class="w-7 h-7 rounded-full bg-zinc-900 text-white shadow-md flex items-center justify-center transition-all duration-300 ease-out active:scale-90 hover:bg-zinc-700" onclick={() => handleMenuAdd(item)}><Plus size={12} /></button>
                    {:else}
                      <span class="w-4 text-center font-semibold text-xs pl-1">{getTotalQuantity(item.id)}</span>
                      <button class="w-7 h-7 rounded-full bg-zinc-900 text-white shadow-md flex items-center justify-center transition-all duration-300 ease-out active:scale-90 hover:bg-zinc-700" onclick={() => handleMenuAdd(item)}><Plus size={12} /></button>
                    {/if}
                  </div>
                {:else}
                  <button class="w-8 h-8 rounded-full bg-zinc-900 text-white shadow-md flex items-center justify-center transition-all duration-300 ease-out active:scale-90 hover:bg-zinc-700 hover:shadow-lg hover:-translate-y-0.5" onclick={() => handleMenuAdd(item)}>
                    <Plus size={16} />
                  </button>
                {/if}
              </div>
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
      <section id="category-{category.id}" class="space-y-3 scroll-mt-32">
        <h2 class="text-base font-semibold text-zinc-950 flex items-center gap-2 border-b border-zinc-100 pb-2">
          {category.icon_emoji} {category.name}
        </h2>
        <div class="space-y-4">
          {#each items as item}
            <div class="menu-card rounded-2xl bg-white/90 backdrop-blur-sm p-3.5 flex gap-3.5 relative overflow-hidden shadow-[0_12px_24px_rgba(0,0,0,0.04)] border border-white/60 transition-all duration-300 ease-out hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1 {item.is_available ? '' : 'opacity-60'}">
              {#if !item.is_available}
                <div class="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-[2px]">
                  <span class="bg-zinc-900 text-white px-3 py-1.5 rounded-lg text-xs font-semibold tracking-widest shadow-md">OUT OF STOCK</span>
                </div>
              {/if}
              <div class="w-24 h-24 shrink-0 rounded-xl bg-zinc-100 overflow-hidden shadow-inner">
                <img src={item.image_url} alt={item.name} class="w-full h-full object-cover transition-transform duration-700 hover:scale-110" loading="lazy" />
              </div>
              <div class="flex flex-col flex-1 min-w-0">
                <div class="flex gap-1 mb-1.5 flex-wrap">
                  {#each item.dietary_tags as tag}<DietaryBadge {tag} />{/each}
                </div>
                <h3 class="font-bold text-[15px] text-zinc-950 leading-tight mb-1">{item.name}</h3>
                <p class="text-xs text-zinc-500 line-clamp-2 mb-auto leading-relaxed">{item.description}</p>
                <div class="mt-3 flex items-center justify-between">
                  <div>
                    <span class="font-bold text-[15px] text-zinc-900">{formatCurrency(item.price)}</span>
                    {#if item.preparation_time}
                      <span class="text-[10px] text-zinc-400 ml-1.5 font-medium">⏱ {item.preparation_time}m</span>
                    {/if}
                  </div>
                  {#if item.is_available}
                    {#if getTotalQuantity(item.id) > 0}
                      <div class="flex items-center gap-1.5 bg-zinc-100 rounded-full p-0.5 border border-zinc-200/50 shadow-inner z-20">
                        {#if allVariations.filter(v => v.menu_item_id === item.id).length === 0 && allAddons.filter(a => a.menu_item_id === item.id).length === 0}
                          <button class="w-7 h-7 rounded-full bg-white border border-zinc-200/50 shadow-sm flex items-center justify-center transition-all duration-300 ease-out active:scale-90 hover:bg-zinc-50" onclick={() => cart.setQuantity(cart.generateCartKey(item.id), getTotalQuantity(item.id) - 1)}><Minus size={12} /></button>
                          <span class="w-4 text-center font-semibold text-xs">{getTotalQuantity(item.id)}</span>
                          <button class="w-7 h-7 rounded-full bg-zinc-900 text-white shadow-md flex items-center justify-center transition-all duration-300 ease-out active:scale-90 hover:bg-zinc-700" onclick={() => handleMenuAdd(item)}><Plus size={12} /></button>
                        {:else}
                          <span class="w-4 text-center font-semibold text-xs pl-1">{getTotalQuantity(item.id)}</span>
                          <button class="w-7 h-7 rounded-full bg-zinc-900 text-white shadow-md flex items-center justify-center transition-all duration-300 ease-out active:scale-90 hover:bg-zinc-700" onclick={() => handleMenuAdd(item)}><Plus size={12} /></button>
                        {/if}
                      </div>
                    {:else}
                      <button class="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center shadow-md z-20 transition-all duration-300 ease-out active:scale-90 hover:-translate-y-0.5 hover:shadow-lg hover:bg-zinc-700" onclick={() => handleMenuAdd(item)}>
                        <Plus size={15} />
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

<!-- Floating Buttons -->
<div class="fixed right-4 flex flex-col gap-4 z-40" style="bottom: max(24px, env(safe-area-inset-bottom, 24px)); perspective: 800px;">
  <!-- Call Waiter -->
  <button 
    class="w-12 h-12 rounded-full bg-white/90 backdrop-blur-md border border-white/50 shadow-[0_8px_24px_rgba(0,0,0,0.08)] flex items-center justify-center text-zinc-700 transition-all duration-300 ease-out active:scale-90 hover:-translate-y-1 {waiterCalled ? 'text-orange-500 border-orange-300/50 shadow-orange-500/20' : ''} {waiterCooldown && !waiterCalled ? 'opacity-50' : ''}"
    onclick={handleCallWaiter}
    title="Call Waiter"
  >
    <Bell size={20} class={waiterCalled ? 'animate-bounce' : ''} />
  </button>

  <!-- Cart FAB -->
  {#if $cartCount > 0 && !isCartOpen}
    <div transition:fly={{ y: 30, duration: 400, opacity: 0 }} style="animation: breathe 3s ease-in-out infinite alternate;">
      <button 
        class="w-14 h-14 rounded-full bg-zinc-900/90 backdrop-blur-xl border border-zinc-700/50 shadow-[0_20px_40px_rgba(24,24,27,0.3)] flex items-center justify-center text-white transition-all duration-300 ease-out active:scale-90 hover:bg-zinc-800 hover:shadow-[0_25px_50px_rgba(24,24,27,0.4)]"
        onclick={() => isCartOpen = true}
      >
        <ShoppingCart size={22} />
        <span class="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-md">
          {$cartCount}
        </span>
      </button>
    </div>
    <style>
      @keyframes breathe {
        0% { transform: translateY(0px); }
        100% { transform: translateY(-6px); }
      }
    </style>
  {/if}
</div>

<!-- Cart Panel -->
{#if isCartOpen}
  <div class="fixed inset-0 z-50 flex flex-col justify-end" transition:fade={{ duration: 300 }}>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm" onclick={() => isCartOpen = false}></div>
    
    <div 
      class="bg-white/95 backdrop-blur-2xl w-full max-h-[85vh] rounded-t-3xl shadow-[0_-20px_40px_rgba(0,0,0,0.15)] relative flex flex-col overflow-hidden border-t border-white/40"
      transition:fly={{ y: '100%', duration: 400, opacity: 1 }}
      style="transform-origin: bottom center; animation: swingIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;"
    >
      <style>
        @keyframes swingIn {
          0% { transform: perspective(1000px) rotateX(25deg) translateY(20px); opacity: 0; }
          100% { transform: perspective(1000px) rotateX(0deg) translateY(0); opacity: 1; }
        }
      </style>
      <button type="button" aria-label="Close cart" class="w-full flex justify-center py-3" onclick={() => isCartOpen = false}>
        <div class="w-12 h-1.5 bg-zinc-300 rounded-full"></div>
      </button>
      
      <div class="px-6 pb-4 flex items-center justify-between border-b border-zinc-200/50">
        <h2 class="text-xl font-bold text-zinc-950 flex items-center gap-2">
          Your Order <span class="inline-flex items-center justify-center rounded-full bg-zinc-900 text-white text-xs font-bold w-6 h-6 shadow-sm">{$cartCount}</span>
        </h2>
        <button class="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-colors" onclick={() => isCartOpen = false}>
          <X size={16} />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-6 space-y-4">
        {#each $cart as item}
          <div class="flex items-center gap-3">
            <div class="w-14 h-14 rounded-lg bg-zinc-100 overflow-hidden shrink-0">
              <img src={item.menu_item.image_url} alt={item.menu_item.name} class="w-full h-full object-cover" />
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="font-medium text-sm text-zinc-900 truncate">{item.menu_item.name}</h4>
              {#if item.variation}
                <span class="text-xs text-zinc-400">{item.variation.name} (+{formatCurrency(item.variation.extra_price)})</span>
              {/if}
              {#if item.addons.length > 0}
                <span class="text-xs text-zinc-400">{item.addons.map(a => a.name).join(', ')}</span>
              {/if}
              <span class="block font-semibold text-sm text-zinc-900">
                {formatCurrency(item.menu_item.price + (item.variation?.extra_price || 0) + item.addons.reduce((sum, a) => sum + a.extra_price, 0))}
              </span>
            </div>
            <div class="flex items-center gap-1.5 bg-zinc-100 rounded-full p-0.5 border border-zinc-200">
              <button class="w-7 h-7 rounded-full bg-white border border-zinc-200 flex items-center justify-center active:scale-95" onclick={() => cart.setQuantity(cart.generateCartKey(item.menu_item.id, item.variation, item.addons), item.quantity - 1)}><Minus size={13} /></button>
              <span class="w-4 text-center font-semibold text-sm">{item.quantity}</span>
              <button class="w-7 h-7 rounded-full bg-zinc-900 text-white flex items-center justify-center active:scale-95" onclick={() => cart.setQuantity(cart.generateCartKey(item.menu_item.id, item.variation, item.addons), item.quantity + 1)}><Plus size={13} /></button>
            </div>
          </div>
        {/each}

        <div class="space-y-1.5 pt-2">
          <label for="instructions" class="text-sm font-medium text-zinc-700">📝 Special Instructions</label>
          <textarea 
            id="instructions" 
            bind:value={specialInstructions}
            placeholder="Any allergies or special requests?"
            class="flex w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 h-20 resize-none"
          ></textarea>
        </div>
      </div>

      <div class="p-6 border-t border-zinc-100 bg-zinc-50 space-y-3">
        <div class="flex justify-between text-sm text-zinc-500">
          <span>Subtotal</span><span>{formatCurrency($cartTotal)}</span>
        </div>
        <div class="flex justify-between text-sm text-zinc-500">
          <span>Taxes (10%)</span><span>{formatCurrency($cartTotal * 0.1)}</span>
        </div>
        <div class="flex justify-between font-bold text-base text-zinc-950 pt-2 border-t border-zinc-200">
          <span>Total</span><span>{formatCurrency($cartTotal * 1.1)}</span>
        </div>
        <button 
          class="inline-flex w-full items-center justify-center rounded-md bg-zinc-900 text-zinc-50 shadow hover:bg-zinc-800 h-11 px-4 text-sm font-medium transition-colors mt-1"
          onclick={placeOrder}
        >
          Place Order
        </button>
        <button 
          class="inline-flex w-full items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 h-9 px-4 text-sm font-medium transition-colors"
          onclick={handleCallWaiter}
        >
          <Bell size={14} /> Need assistance? Call Waiter
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Item Configuration Modal -->
{#if activeItem}
  <div class="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-4 pb-4 sm:p-0" transition:fade={{ duration: 200 }}>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" onclick={() => activeItem = null}></div>
    
    <div class="bg-white w-full max-w-md rounded-2xl relative z-10 flex flex-col overflow-hidden border border-zinc-200 shadow-2xl max-h-[85vh]">
      <div class="relative h-44 bg-zinc-100">
        <img src={activeItem.image_url} alt={activeItem.name} class="w-full h-full object-cover" />
        <div class="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
        <button class="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 text-zinc-900 flex items-center justify-center hover:bg-white shadow" onclick={() => activeItem = null}>
          <X size={16} />
        </button>
      </div>
      
      <div class="p-5 overflow-y-auto flex-1 space-y-5">
        <div>
          <h3 class="text-xl font-bold text-zinc-950 mb-1">{activeItem.name}</h3>
          <p class="text-sm text-zinc-400">{activeItem.description}</p>
        </div>

        {#if allVariations.filter(v => activeItem && v.menu_item_id === activeItem.id).length > 0}
          <div class="space-y-2">
            <h4 class="font-semibold text-sm text-zinc-900">Options <span class="text-orange-600 text-xs font-normal ml-1 bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5">Required</span></h4>
            <div class="space-y-1.5">
              {#each allVariations.filter(v => activeItem && v.menu_item_id === activeItem.id) as v}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div 
                  class="flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors {selectedVariation?.id === v.id ? 'bg-zinc-900 border-zinc-900 text-white' : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'}"
                  onclick={() => selectedVariation = v}
                >
                  <span class="font-medium text-sm">{v.name}</span>
                  <span class="text-sm">{v.extra_price > 0 ? `+${formatCurrency(v.extra_price)}` : 'Free'}</span>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        {#if allAddons.filter(a => activeItem && a.menu_item_id === activeItem.id).length > 0}
          <div class="space-y-2">
            <h4 class="font-semibold text-sm text-zinc-900">Add-ons <span class="text-zinc-400 text-xs font-normal ml-1 bg-zinc-50 border border-zinc-200 rounded-full px-2 py-0.5">Optional</span></h4>
            <div class="space-y-1.5">
              {#each allAddons.filter(a => activeItem && a.menu_item_id === activeItem.id) as a}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div 
                  class="flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors {selectedAddons.find(sa => sa.id === a.id) ? 'bg-zinc-900 border-zinc-900 text-white' : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'}"
                  onclick={() => toggleAddon(a)}
                >
                  <div class="flex items-center gap-3">
                    <div class="w-4 h-4 rounded border {selectedAddons.find(sa => sa.id === a.id) ? 'border-white bg-white flex items-center justify-center' : 'border-zinc-300'}">
                      {#if selectedAddons.find(sa => sa.id === a.id)}
                        <svg viewBox="0 0 14 14" fill="none" class="w-3 h-3 text-zinc-900"><path d="M3 7.5L5.5 10L11 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                      {/if}
                    </div>
                    <span class="font-medium text-sm">{a.name}</span>
                  </div>
                  <span class="text-sm">+{formatCurrency(a.extra_price)}</span>
                </div>
              {/each}
            </div>
          </div>
        {/if}
        
        <div class="flex items-center justify-between pt-2 border-t border-zinc-100">
          <span class="font-semibold text-sm text-zinc-900">Quantity</span>
          <div class="flex items-center gap-2 bg-zinc-100 rounded-full p-0.5 border border-zinc-200">
            <button class="w-9 h-9 rounded-full bg-white border border-zinc-200 flex items-center justify-center active:scale-95" onclick={() => itemModalQty = Math.max(1, itemModalQty - 1)}><Minus size={14} /></button>
            <span class="w-5 text-center font-bold">{itemModalQty}</span>
            <button class="w-9 h-9 rounded-full bg-zinc-900 text-white flex items-center justify-center active:scale-95" onclick={() => itemModalQty++}><Plus size={14} /></button>
          </div>
        </div>
      </div>
      
      <div class="p-5 border-t border-zinc-100">
        <button 
          class="inline-flex w-full items-center justify-between rounded-md bg-zinc-900 text-zinc-50 shadow hover:bg-zinc-800 h-12 px-5 text-sm font-semibold transition-colors disabled:opacity-50"
          onclick={confirmItemModal}
          disabled={allVariations.filter(v => activeItem && v.menu_item_id === activeItem.id).length > 0 && !selectedVariation}
        >
          <span>Add to Cart</span>
          <span>{formatCurrency((activeItem.price + (selectedVariation?.extra_price || 0) + selectedAddons.reduce((sum, a) => sum + a.extra_price, 0)) * itemModalQty)}</span>
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
    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" onclick={() => !isProcessingPayment && (showCheckoutModal = false)}></div>
    
    <div class="bg-white w-full max-w-md rounded-2xl p-6 relative z-10 space-y-5 shadow-2xl border border-zinc-200">
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-bold text-zinc-950">Payment</h3>
        <button class="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-zinc-900" onclick={() => showCheckoutModal = false} disabled={isProcessingPayment}>
          <X size={16} />
        </button>
      </div>

      <div class="text-center py-4 border-y border-zinc-100">
        <p class="text-sm text-zinc-400 mb-1">Amount to Pay</p>
        <p class="text-3xl font-bold text-zinc-950">{formatCurrency($cartTotal * 1.1)}</p>
      </div>

      <div class="grid grid-cols-3 gap-2">
        {#each [{ id: 'upi', icon: Smartphone, label: 'UPI' }, { id: 'card', icon: CreditCard, label: 'Card' }, { id: 'cash', icon: Banknote, label: 'Cash' }] as method}
          <button 
            class="flex flex-col items-center gap-2 p-3 rounded-xl border transition-colors {paymentMethod === method.id ? 'bg-zinc-900 border-zinc-900 text-white' : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50'}"
            onclick={() => paymentMethod = method.id as any}
          >
            <method.icon size={18} />
            <span class="text-xs font-medium">{method.label}</span>
          </button>
        {/each}
      </div>

      <div class="min-h-[100px] flex flex-col justify-center">
        {#if paymentMethod === 'upi'}
          <div class="space-y-2">
            <label class="text-sm font-medium text-zinc-700" for="upi-input">UPI ID</label>
            <input id="upi-input" type="text" class="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950" value="goldenfork@upi" />
          </div>
        {:else if paymentMethod === 'card'}
          <div class="space-y-2">
            <input type="text" class="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950" placeholder="Card Number" value="**** **** **** 4242" />
            <div class="flex gap-2">
              <input type="text" class="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950" placeholder="MM/YY" value="12/26" />
              <input type="text" class="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950" placeholder="CVV" value="***" />
            </div>
          </div>
        {:else}
          <div class="text-center text-sm text-zinc-400 py-4">
            Our waiter will come to your table to collect cash.
          </div>
        {/if}
      </div>

      <button 
        class="inline-flex w-full items-center justify-center rounded-md bg-zinc-900 text-zinc-50 shadow hover:bg-zinc-800 h-12 px-4 text-sm font-semibold transition-colors disabled:opacity-50"
        onclick={handlePayment}
        disabled={isProcessingPayment}
      >
        {#if isProcessingPayment}
          <div class="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
        {:else}
          {paymentMethod === 'cash' ? 'Place Order (Cash)' : 'Confirm Payment'}
        {/if}
      </button>
    </div>
  </div>
{/if}
