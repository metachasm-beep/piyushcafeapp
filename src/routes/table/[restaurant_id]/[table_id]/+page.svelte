<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { ShoppingCart, Bell, Plus, Minus, X, Smartphone, CreditCard, Banknote, Check } from 'lucide-svelte';
  import { toast } from 'svelte-sonner';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  
  import confetti from 'canvas-confetti';
  
  import { session } from '$lib/stores/session';
  import { cart, cartCount, cartTotal } from '$lib/stores/cart';
  import { formatCurrency } from '$lib/utils';
  
  import DietaryBadge from '$lib/components/DietaryBadge.svelte';
  import type { PageData } from './$types';

  function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success') {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (type === 'light') navigator.vibrate(10);
      if (type === 'medium') navigator.vibrate(30);
      if (type === 'heavy') navigator.vibrate(50);
      if (type === 'success') navigator.vibrate([30, 50, 30]);
    }
  }

  let { data }: { data: PageData } = $props();
  let restaurant = $derived(data.restaurant);
  let table = $derived(data.table);
  let categories = $derived(data.categories);
  let menuItems = $derived(data.menuItems);
  let allVariations = $derived(data.variations);
  let allAddons = $derived(data.addons);

  function hexToRgb(hex: string) {
    if (!hex) return '9 9 11';
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `${r} ${g} ${b}`;
  }
  let primaryColor = $derived(restaurant?.primary_color || '#09090b');
  let primaryRgb = $derived(hexToRgb(primaryColor));

  $effect(() => { session.init(restaurant, table); });

  
  onMount(async () => {

    if (browser) {
      const gsap = (await import('gsap')).default;
      const ScrollTrigger = (await import('gsap/ScrollTrigger')).default;
      gsap.registerPlugin(ScrollTrigger);

      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
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

    
    const hour = new Date().getHours();
    isDarkMode = (hour >= 18 || hour < 6); // 6 PM to 6 AM
    
    // Splash screen timer
    setTimeout(() => {
      showSplash = false;
    }, 2000);
  });

  let showSplash = $state(true);
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
  let itemSpecialInstructions = $state('');
  
  let featuredItems = $derived(menuItems.filter(item => item.is_featured && item.is_available));
  
  let activeIndex = $state(0);
  
  let flatMenuItems = $derived.by(() => {
    let flat: any[] = [];
    for (const cat of categories) {
      const items = menuItems.filter((i: any) => i.category_id === cat.id);
      flat.push(...items);
    }
    return flat;
  });

  function trackActive(node: HTMLElement, { index, categoryId }: { index: number, categoryId: string }) {
    if (typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            activeIndex = index;
            activeCategory = categoryId;
          }
        });
      }, { root: document.getElementById('carousel-container'), threshold: 0.6 });
      observer.observe(node);
      return { destroy() { observer.disconnect(); } };
    }
  }

  
  function parallaxCard(node: HTMLElement, { active }: { active: boolean }) {
    let bounds = node.getBoundingClientRect();
    const image = node.querySelector('.parallax-img') as HTMLElement;
    
    function updateTransform(x: number, y: number) {
      if (!active) return;
      const rotX = (y / bounds.height - 0.5) * -15; // Max 15deg tilt
      const rotY = (x / bounds.width - 0.5) * 15;
      node.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
      if (image) {
        image.style.transform = `scale(1.1) translateX(${rotY * -1}px) translateY(${rotX * 1}px)`;
      }
    }

    function onMouseMove(e: MouseEvent) { updateTransform(e.clientX - bounds.left, e.clientY - bounds.top); }
    function onDeviceOrientation(e: DeviceOrientationEvent) {
      if (!active || !e.beta || !e.gamma) return;
      const rotX = Math.max(-15, Math.min(15, e.beta - 45)); // Assuming 45deg holding angle
      const rotY = Math.max(-15, Math.min(15, e.gamma));
      node.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
      if (image) image.style.transform = `scale(1.1) translateX(${rotY * -1}px) translateY(${rotX * 1}px)`;
    }
    
    // Reset transforms when not active
    function reset() {
       if(!active) {
         node.style.transform = '';
         if(image) image.style.transform = 'scale(1)';
       }
    }

    function onScroll() { bounds = node.getBoundingClientRect(); }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('deviceorientation', onDeviceOrientation);
    window.addEventListener('scroll', onScroll);
    
    return {
      update(params: { active: boolean }) {
        active = params.active;
        reset();
      },
      destroy() {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('deviceorientation', onDeviceOrientation);
        window.removeEventListener('scroll', onScroll);
      }
    };
  }

  function scrollToCarouselItem(catId: string) {
    activeCategory = catId;
    const firstItemIndex = flatMenuItems.findIndex((item: any) => item.category_id === catId);
    if (firstItemIndex >= 0) {
      const el = document.getElementById(`carousel-item-${firstItemIndex}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', inline: 'center' });
      }
    }
  }

  function handleCallWaiter() {
    if (waiterCooldown) { toast('Waiter is already on the way!'); return; }
    toast.success('Waiter called! 🛎️ Someone will be with you shortly.');
    triggerHaptic('medium');
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
        triggerHaptic('success');
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
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
    triggerHaptic('light');
    const itemVars = allVariations.filter(v => v.menu_item_id === item.id);
    activeItem = item;
    selectedVariation = itemVars.length > 0 ? itemVars[0] : null;
    selectedAddons = [];
    itemModalQty = 1;
    itemSpecialInstructions = '';
  }

  function confirmItemModal() {
    if (activeItem) {
      cart.addItem(activeItem, itemModalQty, itemSpecialInstructions, selectedVariation, selectedAddons);
      activeItem = null;
      toast.success('Added to cart');
      triggerHaptic('success');
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.8 },
        colors: [primaryColor, '#ffffff', '#F59E0B']
      });
    }
  }
  
  function toggleAddon(addon: typeof allAddons[0]) {
    const idx = selectedAddons.findIndex(a => a.id === addon.id);
    if (idx >= 0) { selectedAddons = selectedAddons.filter(a => a.id !== addon.id); }
    else { selectedAddons = [...selectedAddons, addon]; }
  }

  // Action for magnetic buttons (Suggestion #8)
  
  // Dark Mode Logic (Suggestion #3)
  let isDarkMode = $state(false);

  // Swipe Action (Suggestion #2)
  function swipeOrder(node: HTMLElement, { item }: { item: any }) {
    let startX = 0;
    let currentX = 0;
    let isSwiping = false;

    function handleTouchStart(e: TouchEvent) { startX = e.touches[0].clientX; isSwiping = true; }
    function handleTouchMove(e: TouchEvent) {
      if (!isSwiping) return;
      currentX = e.touches[0].clientX - startX;
      if (currentX > 0) { node.style.transform = `translateX(${currentX}px)`; }
    }
    function handleTouchEnd() {
      if (!isSwiping) return;
      isSwiping = false;
      if (currentX > 100) { 
        handleMenuAdd(item); 
        if (navigator.vibrate) navigator.vibrate(50);
      }
      node.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      node.style.transform = 'translateX(0)';
      setTimeout(() => node.style.transition = '', 300);
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
    };
  }

  function magnetic(node: HTMLElement) {
    let bound = node.getBoundingClientRect();
    
    function onMouseMove(e: MouseEvent) {
      const x = e.clientX - bound.left - bound.width / 2;
      const y = e.clientY - bound.top - bound.height / 2;
      // only trigger within 50px of the button
      if (Math.abs(x) < 80 && Math.abs(y) < 80) {
        gsap.to(node, { x: x * 0.4, y: y * 0.4, duration: 1, ease: 'elastic.out(1, 0.3)' });
      } else {
        gsap.to(node, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.3)' });
      }
    }
    function onScroll() { bound = node.getBoundingClientRect(); gsap.to(node, { x: 0, y: 0, duration: 0.5 }); }
    
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('scroll', onScroll);
    return {
      destroy() {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('scroll', onScroll);
      }
    };
  }
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



<!-- SVG Filter for Liquid Buttons -->
<svg style="position: absolute; width: 0; height: 0;" aria-hidden="true">
  <filter id="goo">
    <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
    <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo" />
    <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
  </filter>
</svg>

<svelte:head>
  <title>{restaurant.name} - Menu</title>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
</svelte:head>

<!-- Splash Screen -->
{#if showSplash}
  <div 
    class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--brand-primary)]"
    out:fade={{ duration: 600 }}
  >
    {#if restaurant.logo_url}
      <img 
        src={restaurant.logo_url} 
        alt={restaurant.name} 
        class="w-80 h-80 md:w-[36rem] md:h-[36rem] max-w-[90vw] max-h-[90vw] rounded-full shadow-2xl object-cover mb-8 border-4 border-white/20 animate-pulse" 
      />
    {/if}
    <h1 
      class="text-[4rem] leading-none md:text-[8rem] font-bold text-white tracking-tight drop-shadow-lg text-center px-4"
      in:fly={{ y: 40, duration: 800, delay: 100 }}
      out:fly={{ y: -40, duration: 500 }}
    >
      {restaurant.name}
    </h1>
    <p 
      class="text-white/70 mt-4 text-xl md:text-3xl uppercase tracking-widest font-semibold"
      in:fade={{ duration: 800, delay: 400 }}
      out:fade={{ duration: 400 }}
    >
      Welcome
    </p>
  </div>
{/if}

<style>
  :global(body) {
    background-color: #f9fafb;
    color: #09090b;
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .hide-scrollbar::-webkit-scrollbar { display: none; }
  .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

  :global(.dark-theme) { background-color: #05050a !important; color: #fafafa !important; }
  :global(.dark-theme .bg-white), :global(.dark-theme .bg-white\/90), :global(.dark-theme .bg-white\/80) { background-color: #0a0a14 !important; border-color: #1a1a2e !important; color: #fff; }
  :global(.dark-theme .text-zinc-950), :global(.dark-theme .text-zinc-900) { color: #f4f4f5 !important; }
  :global(.dark-theme .text-zinc-700), :global(.dark-theme .text-zinc-600), :global(.dark-theme .text-zinc-500) { color: #a1a1aa !important; }
  :global(.dark-theme .bg-zinc-50), :global(.dark-theme .bg-zinc-100) { background-color: #0f0f1a !important; border-color: #1f1f33 !important; }
  :global(.dark-theme header) { background-color: rgba(5,5,10,0.8) !important; border-color: rgba(255,255,255,0.05) !important; }
  :global(.dark-theme .menu-card), :global(.dark-theme .featured-card) { background-color: #0a0a14 !important; border-color: rgba(255,255,255,0.1) !important; box-shadow: 0 4px 30px rgba(0,0,0,0.8), 0 0 15px rgba(var(--brand-primary-rgb, 255,255,255), 0.15) !important; }
  :global(.dark-theme .bg-zinc-900) { background-color: #080812 !important; box-shadow: 0 30px 60px rgba(0,0,0,0.9), 0 0 30px rgba(var(--brand-primary-rgb, 255,255,255), 0.1) !important; }
  :global(.dark-theme .featured-card .w-full.bg-zinc-100) { background-color: #000 !important; }

  @keyframes gradientBlob {
    0% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(5vw, -5vh) scale(1.1); }
    66% { transform: translate(-5vw, 5vh) scale(0.9); }
    100% { transform: translate(0, 0) scale(1); }
  }
  .mesh-bg {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background: radial-gradient(circle at 20% 30%, rgba(var(--brand-primary-rgb, 59, 130, 246), 0.15) 0%, transparent 50%),
                radial-gradient(circle at 80% 70%, rgba(var(--brand-primary-rgb, 59, 130, 246), 0.1) 0%, transparent 50%);
    animation: gradientBlob 20s ease-in-out infinite;
  }
  .dark-theme .mesh-bg {
    background: radial-gradient(circle at 20% 30%, rgba(var(--brand-primary-rgb, 59, 130, 246), 0.3) 0%, transparent 50%),
                radial-gradient(circle at 80% 70%, rgba(var(--brand-primary-rgb, 59, 130, 246), 0.2) 0%, transparent 50%);
  }
  
  .gooey-filter { filter: url('#goo'); }
  
  .price-text {
    font-weight: 700;
    transition: font-weight 0.3s ease;
  }
  .price-text:hover { font-weight: 900; }
  
  .modal-backdrop {
    backdrop-filter: blur(0px);
    transition: backdrop-filter 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .modal-backdrop.active { backdrop-filter: blur(24px); }

  .btn-shine {
    position: relative;
    overflow: hidden;
  }
  .btn-shine::after {
    content: '';
    position: absolute;
    top: 0; left: -100%; width: 50%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    animation: shine 3s infinite;
  }
  @keyframes shine {
    0% { left: -100%; }
    20% { left: 200%; }
    100% { left: 200%; }
  }
</style>

<div class={isDarkMode ? "dark-theme min-h-screen transition-colors duration-1000" : "min-h-screen transition-colors duration-1000"}>
<!-- Sticky Header Navigation -->
<header class="fixed top-0 left-0 right-0 z-40 bg-white/60 backdrop-blur-2xl border-b border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] transition-all">
  <div class="px-4 py-3 flex items-center justify-between">
    <div class="flex flex-col flex-1 min-w-0 justify-center">
      <h1 class="font-black text-[22px] tracking-tighter text-zinc-950 leading-none truncate">{restaurant.name}</h1>
      <p class="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1">Digital Menu</p>
    </div>

    <div class="flex items-center justify-end pl-2 gap-2.5">
      {#if $session.activeOrderId}
        <button 
          class="inline-flex items-center gap-1.5 rounded-full border border-blue-400/50 bg-blue-500/10 backdrop-blur px-3 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)] whitespace-nowrap animate-pulse"
          onclick={() => goto(`/table/${restaurant.id}/${table.id}/order`)}
        >
          <div class="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Live Order
        </button>
      {/if}
      {#if restaurant.logo_url}
        <img src={restaurant.logo_url} alt="Logo" class="h-8 w-8 object-contain rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.1)] bg-white border-2 border-white" />
      {/if}
      <span class="inline-flex items-center rounded-full border border-white/20 bg-[var(--brand-primary)] backdrop-blur px-3 py-1.5 text-xs font-black text-white drop-shadow-md shadow-[0_4px_12px_rgba(0,0,0,0.15)] whitespace-nowrap">
        {table.display_name ?? `Table ${table.table_number}`}
      </span>
    </div>
  </div>
  
  </header>

<!-- Full-Screen 3D Carousel -->
<div class="mesh-bg"></div>
<main class="fixed inset-0 pt-[80px] pb-[80px] w-full h-[100dvh] bg-zinc-950 overflow-hidden flex flex-col z-10 transition-colors duration-1000 {isDarkMode ? 'dark-theme' : ''}">
  <div id="carousel-container" class="w-full flex-1 flex items-center overflow-x-auto overflow-y-hidden snap-x snap-mandatory hide-scrollbar relative">
    <!-- Spacer at start to center first item -->
    <div class="w-[10vw] md:w-[30vw] shrink-0 snap-start"></div>
    
    {#if flatMenuItems.length === 0}
       <div class="w-full flex justify-center text-white/50 py-20 text-xl font-bold">No items found</div>
    {/if}

    {#each flatMenuItems as item, i}
      <div 
        id="carousel-item-{i}"
        class="w-[80vw] md:w-[40vw] shrink-0 h-[65vh] snap-center px-3 md:px-6 transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] {activeIndex === i ? 'scale-100 opacity-100 z-20' : 'scale-90 opacity-40 z-10'}"
        style="perspective: 1000px;"
        use:trackActive={{index: i, categoryId: item.category_id}}
      >
        <div class="w-full h-full rounded-[2rem] md:rounded-[3rem] relative overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.4)] bg-zinc-900 group card-parallax" style="transform: {activeIndex === i ? 'rotateY(0deg)' : (i > activeIndex ? 'rotateY(-15deg)' : 'rotateY(15deg)')}; transition: transform 0.7s cubic-bezier(0.2,0.8,0.2,1);" use:parallaxCard={{active: activeIndex === i}}>
          {#if item.image_url}
             <img src={item.image_url} alt={item.name} class="absolute inset-0 w-full h-full object-cover parallax-img transition-transform duration-500 ease-out {activeIndex === i ? 'scale-105' : 'scale-100'}" />
          {:else}
             <div class="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center font-serif text-[12rem] text-white/5 font-black tracking-tighter select-none">
                {item.name.substring(0,1).toUpperCase()}
             </div>
          {/if}

          <!-- Dark gradient overlay for text readability -->
          <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>

          <!-- Tags & Out of stock -->
          <div class="absolute top-5 left-5 right-5 flex gap-2 overflow-x-auto hide-scrollbar">
            {#each item.dietary_tags as tag}<div class="shrink-0"><DietaryBadge {tag} /></div>{/each}
            {#if !item.is_available}
               <span class="bg-red-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold tracking-widest shadow-md ml-auto">OUT OF STOCK</span>
            {/if}
          </div>

          <!-- Card Content -->
          <div class="absolute bottom-0 left-0 right-0 p-6 md:p-8 flex flex-col gap-3 transition-all duration-700 {activeIndex === i ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} pointer-events-none">
             <div class="pointer-events-auto">
               <h3 class="text-3xl md:text-4xl font-black text-white leading-tight drop-shadow-md mb-2">{item.name}</h3>
               <p class="text-sm md:text-base text-zinc-300 line-clamp-3 drop-shadow mb-4 leading-relaxed">{item.description}</p>
               <div class="flex items-center justify-between">
                 <span class="text-3xl price-text text-white drop-shadow-md">{formatCurrency(item.price)}</span>
                 {#if item.is_available}
                   <button class="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[var(--brand-primary)] text-white shadow-[0_10px_20px_rgba(0,0,0,0.3)] flex items-center justify-center transition-transform duration-300 active:scale-90 hover:scale-110" onclick={() => handleMenuAdd(item)}>
                      <Plus size={28} />
                   </button>
                 {/if}
               </div>
             </div>
          </div>
        </div>
      </div>
    {/each}

    <!-- Spacer at end -->
    <div class="w-[10vw] md:w-[30vw] shrink-0 snap-end"></div>
  </div>
</main>

<!-- Category Jump Dock -->
<div class="fixed bottom-0 left-0 right-0 h-[80px] bg-black/60 backdrop-blur-2xl border-t border-white/10 z-30 flex items-center px-4 overflow-x-auto hide-scrollbar snap-x snap-mandatory pb-[env(safe-area-inset-bottom,0px)]">
  <div class="flex gap-3 min-w-max px-2 mx-auto">
    {#each categories as category}
      <button 
        class="snap-center px-6 py-3 rounded-full text-[13px] uppercase tracking-widest font-black transition-all duration-500 {activeCategory === category.id ? 'bg-white text-black scale-105 shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'bg-white/10 text-white/60 hover:bg-white/20'}"
        onclick={() => scrollToCarouselItem(category.id)}
      >
        {category.icon_emoji} {category.name}
      </button>
    {/each}
  </div>
</div>


<!-- Floating Buttons -->
<div class="fixed right-4 flex flex-col gap-4 z-40" style="bottom: max(24px, env(safe-area-inset-bottom, 24px)); perspective: 800px;">
  <!-- Call Waiter (Suggestion #8 Magnetic) -->
  <button 
    use:magnetic
    class="w-14 h-14 rounded-full bg-white/90 backdrop-blur-md border border-white/50 shadow-[0_8px_24px_rgba(0,0,0,0.08)] flex items-center justify-center text-zinc-700 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1 {waiterCalled ? 'text-blue-500 border-blue-300/50 shadow-blue-500/20' : ''} {waiterCooldown && !waiterCalled ? 'opacity-50' : ''}"
    onclick={handleCallWaiter}
    title="Call Waiter"
  >
    <Bell size={24} class={waiterCalled ? 'animate-bounce' : ''} />
  </button>

  <!-- Cart FAB (Suggestion #8 Magnetic) -->
  {#if $cartCount > 0 && !isCartOpen}
    <div transition:fly={{ y: 30, duration: 400, opacity: 0 }} style="animation: breathe 3s ease-in-out infinite alternate;">
      <button 
        use:magnetic
        class="w-16 h-16 rounded-full bg-[var(--brand-primary)]/90 backdrop-blur-xl border border-zinc-700/50 shadow-[0_20px_40px_rgba(24,24,27,0.3)] flex items-center justify-center text-white transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:bg-blue-600 hover:shadow-[0_25px_50px_rgba(37,99,235,0.4)]"
        onclick={() => isCartOpen = true}
      >
        <ShoppingCart size={24} />
        <span class="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shadow-md border-2 border-white">
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
    <div class="absolute inset-0 bg-[var(--brand-primary)]/60 backdrop-blur-sm" onclick={() => isCartOpen = false}></div>
    
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
          Your Order <span class="inline-flex items-center justify-center rounded-full bg-[var(--brand-primary)] text-white text-xs font-bold w-6 h-6 shadow-sm">{$cartCount}</span>
        </h2>
        <button class="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-colors" onclick={() => isCartOpen = false}>
          <X size={16} />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-6 space-y-4">
        {#each $cart as item, i}
          <!-- Suggestion #6: Granular Staggered Cascade -->
          <div class="flex items-center gap-4" in:fly={{ y: 30, duration: 500, delay: i * 75, easing: (t) => --t * t * t + 1 }}>
            <div class="w-16 h-16 rounded-xl bg-zinc-100 overflow-hidden shrink-0 shadow-inner relative">
              {#if item.menu_item.image_url}
                <div class="absolute inset-0 bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 animate-pulse -z-10"></div>
                <img src={item.menu_item.image_url} alt={item.menu_item.name} class="w-full h-full object-cover z-0" />
              {:else}
                <div class="w-full h-full bg-[var(--brand-primary)] text-white flex items-center justify-center font-serif text-2xl opacity-90 relative overflow-hidden">
                  <span class="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8L3N2Zz4=')]"></span>
                  {item.menu_item.name.substring(0, 1)}
                </div>
              {/if}
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="font-bold text-[15px] text-zinc-950 truncate flex items-center">{item.menu_item.name} {@render dietaryIcon(item.menu_item.dietary_tags)}</h4>
              {#if item.variation}
                <span class="text-[11px] text-zinc-500 block leading-tight">{item.variation.name} (+{formatCurrency(item.variation.extra_price)})</span>
              {/if}
              {#if item.addons.length > 0}
                <span class="text-[11px] text-zinc-500 block leading-tight">{item.addons.map(a => a.name).join(', ')}</span>
              {/if}
              {#if item.special_instructions}
                <span class="text-[11px] text-zinc-500 block leading-tight italic">Note: {item.special_instructions}</span>
              {/if}
              <span class="block font-bold text-[15px] text-zinc-900 mt-1">
                {formatCurrency(item.menu_item.price + (item.variation?.extra_price || 0) + item.addons.reduce((sum, a) => sum + a.extra_price, 0))}
              </span>
            </div>
            <div class="flex items-center gap-1.5 bg-zinc-100 rounded-full p-1 border border-zinc-200 shadow-inner shrink-0">
              <button class="w-7 h-7 rounded-full bg-white border border-zinc-200 flex items-center justify-center transition-transform ease-[cubic-bezier(0.34,1.56,0.64,1)] duration-300 active:scale-75 shadow-sm" onclick={() => cart.setQuantity(cart.generateCartKey(item.menu_item.id, item.variation, item.addons), item.quantity - 1)}><Minus size={13} /></button>
              <span class="w-4 text-center font-bold text-sm">{item.quantity}</span>
              <button class="w-7 h-7 rounded-full bg-[var(--brand-primary)] text-white flex items-center justify-center transition-transform ease-[cubic-bezier(0.34,1.56,0.64,1)] duration-300 active:scale-75 shadow-md" onclick={() => cart.setQuantity(cart.generateCartKey(item.menu_item.id, item.variation, item.addons), item.quantity + 1)}><Plus size={13} /></button>
            </div>
          </div>
        {/each}

        <div class="space-y-2 pt-4">
          <label for="instructions" class="text-xs font-bold text-zinc-700 uppercase tracking-widest">Special Instructions</label>
          <!-- Suggestion #7: Intelligent Form Styling -->
          <textarea 
            id="instructions" 
            bind:value={specialInstructions}
            class="flex w-full rounded-xl border-0 bg-zinc-50 px-4 py-3 text-[15px] text-zinc-900 shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:bg-white transition-all h-24 resize-none"
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
          class="btn-shine flex w-full items-center justify-center gap-3 rounded-[1rem] bg-[var(--brand-primary)] text-white drop-shadow-md shadow-[0_8px_20px_rgba(0,0,0,0.15)] hover:scale-[1.02] active:scale-95 h-14 px-6 text-lg font-black transition-all mt-2"
          onclick={placeOrder}
        >
          <ShoppingCart size={20} />
          <span>Place Order</span>
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

<!-- Item Configuration Modal (Visual Canvas) -->
{#if activeItem}
  <div class="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-4 pb-4 sm:p-0" transition:fade={{ duration: 200 }}>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="absolute inset-0 bg-black/40 modal-backdrop active" onclick={() => activeItem = null}></div>
    
    <div class="bg-white w-full max-w-md rounded-[2rem] relative z-10 flex flex-col overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.4)] max-h-[90vh]">
      <div class="relative h-64 bg-zinc-950 overflow-hidden">
        <img src={activeItem.image_url} alt={activeItem.name} class="w-full h-full object-cover opacity-80" />
        <div class="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent dark:from-zinc-900"></div>
        
        <!-- Floating Add-on Particles -->
        {#each selectedAddons as a (a.id)}
          <div 
            class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 bg-white/90 backdrop-blur text-xs font-bold rounded-full shadow-lg"
            in:fly={{ y: 50, duration: 400, easing: (t) => { const s = 1.70158; return --t * t * ((s + 1) * t + s) + 1; } }}
            out:fade={{ duration: 200 }}
          >
            + {a.name}
          </div>
        {/each}

        <button class="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/40 transition-colors" onclick={() => activeItem = null}>
          <X size={20} />
        </button>
      </div>
      
      <div class="p-6 overflow-y-auto flex-1 space-y-6 relative -mt-8 bg-white rounded-t-[2rem]">
        <div>
          <h3 class="text-2xl font-black text-zinc-950 mb-1">{activeItem.name}</h3>
          <p class="text-sm text-zinc-500 leading-relaxed">{activeItem.description}</p>
        </div>

        {#if allVariations.filter(v => activeItem && v.menu_item_id === activeItem.id).length > 0}
          <div class="space-y-3">
            <h4 class="font-bold text-sm text-zinc-900 uppercase tracking-widest">Options <span class="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full ml-2">Required</span></h4>
            <div class="grid grid-cols-2 gap-2">
              {#each allVariations.filter(v => activeItem && v.menu_item_id === activeItem.id) as v}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div 
                  class="flex flex-col items-center justify-center p-3 rounded-2xl border-2 cursor-pointer transition-all active:scale-95 {selectedVariation?.id === v.id ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/5' : 'border-zinc-100 hover:border-zinc-200'}"
                  onclick={() => selectedVariation = v}
                >
                  <span class="font-bold text-sm text-zinc-900">{v.name}</span>
                  <span class="text-xs text-zinc-500">{v.extra_price > 0 ? `+${formatCurrency(v.extra_price)}` : 'Free'}</span>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        {#if allAddons.filter(a => activeItem && a.menu_item_id === activeItem.id).length > 0}
          <div class="space-y-3">
            <h4 class="font-bold text-sm text-zinc-900 uppercase tracking-widest">Add-ons</h4>
            <div class="space-y-2">
              {#each allAddons.filter(a => activeItem && a.menu_item_id === activeItem.id) as a}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div 
                  class="flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all active:scale-95 {selectedAddons.find(sa => sa.id === a.id) ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/5' : 'border-zinc-100 hover:border-zinc-200'}"
                  onclick={() => toggleAddon(a)}
                >
                  <span class="font-bold text-sm text-zinc-900">{a.name}</span>
                  <span class="text-sm font-semibold text-[var(--brand-primary)]">+${formatCurrency(a.extra_price)}</span>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <div class="space-y-3">
          <h4 class="font-bold text-sm text-zinc-900 uppercase tracking-widest">Special Instructions</h4>
          <textarea 
            bind:value={itemSpecialInstructions}
            placeholder="e.g. No onions, extra spicy, etc."
            class="flex w-full rounded-xl border-2 border-zinc-100 bg-white px-4 py-3 text-[15px] text-zinc-900 focus-visible:outline-none focus-visible:border-[var(--brand-primary)] focus-visible:bg-[var(--brand-primary)]/5 transition-all h-20 resize-none"
          ></textarea>
        </div>
        
        <div class="flex items-center justify-between pt-4 border-t border-zinc-100">
          <span class="font-bold text-sm text-zinc-900 uppercase tracking-widest">Quantity</span>
          <div class="flex items-center gap-4 bg-zinc-100 rounded-full p-1 border border-zinc-200 shadow-inner">
            <button class="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-95" onclick={() => itemModalQty = Math.max(1, itemModalQty - 1)}><Minus size={16} /></button>
            <span class="w-6 text-center font-black text-lg">{itemModalQty}</span>
            <button class="w-10 h-10 rounded-full bg-zinc-900 text-white shadow-md flex items-center justify-center active:scale-95" onclick={() => itemModalQty++}><Plus size={16} /></button>
          </div>
        </div>
      </div>
      
      <div class="p-6 bg-white border-t border-zinc-100">
        <button 
          class="flex w-full items-center justify-between rounded-2xl bg-[var(--brand-primary)] text-white shadow-xl hover:opacity-90 h-14 px-6 text-lg font-black transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
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
            class="flex flex-col items-center gap-2 p-3 rounded-xl border transition-colors {paymentMethod === method.id ? 'bg-[var(--brand-primary)] border-[var(--brand-primary)] text-white' : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50'}"
            onclick={() => paymentMethod = method.id as any}
          >
            <method.icon size={18} />
            <span class="text-xs font-medium">{method.label}</span>
          </button>
        {/each}
      </div>

      <div class="min-h-[100px] flex flex-col justify-center">
        <!-- Suggestion #7: Intelligent Form Styling -->
        {#if paymentMethod === 'upi'}
          <div class="space-y-2">
            <label class="text-xs font-bold text-zinc-700 uppercase tracking-widest" for="upi-input">UPI ID</label>
            <input id="upi-input" type="text" class="flex h-12 w-full rounded-xl border-0 bg-zinc-50 px-4 text-[15px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:bg-white transition-all text-zinc-950" value="goldenfork@upi" />
          </div>
        {:else if paymentMethod === 'card'}
          <div class="space-y-3">
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-zinc-700 uppercase tracking-widest" for="card-input">Card Number</label>
              <input id="card-input" type="text" class="flex h-12 w-full rounded-xl border-0 bg-zinc-50 px-4 text-[15px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:bg-white transition-all text-zinc-950" value="**** **** **** 4242" />
            </div>
            <div class="flex gap-3">
              <div class="space-y-1.5 flex-1">
                <label class="text-xs font-bold text-zinc-700 uppercase tracking-widest" for="expiry-input">Expiry</label>
                <input id="expiry-input" type="text" class="flex h-12 w-full rounded-xl border-0 bg-zinc-50 px-4 text-[15px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:bg-white transition-all text-zinc-950" value="12/26" />
              </div>
              <div class="space-y-1.5 flex-1">
                <label class="text-xs font-bold text-zinc-700 uppercase tracking-widest" for="cvv-input">CVV</label>
                <input id="cvv-input" type="text" class="flex h-12 w-full rounded-xl border-0 bg-zinc-50 px-4 text-[15px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:bg-white transition-all text-zinc-950" value="***" />
              </div>
            </div>
          </div>
        {:else}
          <div class="text-center text-sm font-medium text-zinc-500 py-4 bg-zinc-50 rounded-xl">
            Our waiter will come to your table to collect cash.
          </div>
        {/if}
      </div>

      <button 
        class="btn-shine flex w-full items-center justify-center gap-3 rounded-[1rem] bg-[var(--brand-primary)] text-white drop-shadow-md shadow-[0_8px_20px_rgba(0,0,0,0.15)] hover:scale-[1.02] active:scale-95 h-14 px-6 text-lg font-black transition-all disabled:opacity-50 disabled:scale-100"
        onclick={handlePayment}
        disabled={isProcessingPayment}
      >
        {#if isProcessingPayment}
          <div class="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
          <span>Processing...</span>
        {:else}
          <Check size={24} strokeWidth={3} />
          <span>{paymentMethod === 'cash' ? 'Place Order (Cash)' : 'Confirm Payment'}</span>
        {/if}
      </button>
    </div>
  </div>
{/if}

</div>