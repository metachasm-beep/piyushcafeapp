<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import {
    ShoppingCart,
    Bell,
    Plus,
    Minus,
    X,
    Smartphone,
    CreditCard,
    Banknote,
    Package,
    CheckCircle2
  } from '@lucide/svelte';
  import { toast } from 'svelte-sonner';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  import { session } from '$lib/stores/session';
  import { cart, cartCount, cartTotal } from '$lib/stores/cart';
  import { waiterRequests } from '$lib/stores/admin';
  import { formatCurrency, generateUUID } from '$lib/utils';

  import DietaryBadge from '$lib/components/DietaryBadge.svelte';
  import type { PageData } from './$types';
  import type { DietaryTag, MenuItem } from '$lib/types';

  let { data }: { data: PageData } = $props();
  let restaurant = $derived(data.restaurant);
  let table = $derived(data.table);
  let categories = $derived(data.categories);
  let menuItems = $derived(data.menuItems);

  $effect(() => {
    session.init(restaurant, table);
  });

  let activeCategory = $state('all');
  let dietaryFilters = $state<DietaryTag[]>([]);
  let menuReady = $state(false);

  let isCartOpen = $state(false);
  let showCheckoutModal = $state(false);
  let paymentMethod = $state<'upi' | 'card' | 'cash'>('upi');
  let isProcessingPayment = $state(false);
  let paymentError = $state('');
  let specialInstructions = $state('');

  let upiId = $state('goldenfork@upi');
  let cardNumber = $state('4242424242424242');
  let cardExpiry = $state('12/26');
  let cardCvv = $state('123');

  let waiterCalled = $state(false);
  let waiterCooldown = $state(false);
  let showWaiterBanner = $state(false);
  let cooldownSeconds = $state(0);

  // Sheet swipe dismiss
  let cartSheetY = $state(0);
  let checkoutSheetY = $state(0);
  let swipeStartY = 0;
  let swiping = $state(false);

  const DIETARY_FILTERS: { id: DietaryTag; label: string }[] = [
    { id: 'veg', label: 'Veg' },
    { id: 'vegan', label: 'Vegan' },
    { id: 'spicy', label: 'Spicy' },
    { id: 'gluten_free', label: 'GF' }
  ];

  onMount(() => {
    // Brief skeleton so first paint never feels empty / jumpy
    const t = setTimeout(() => {
      menuReady = true;
    }, 280);
    return () => clearTimeout(t);
  });

  $effect(() => {
    if (!waiterCooldown || cooldownSeconds <= 0) return;
    const id = setInterval(() => {
      cooldownSeconds = Math.max(0, cooldownSeconds - 1);
      if (cooldownSeconds === 0) {
        waiterCooldown = false;
        showWaiterBanner = false;
      }
    }, 1000);
    return () => clearInterval(id);
  });

  let featuredItems = $derived(
    menuItems.filter((item) => item.is_featured && item.is_available && matchesDietary(item))
  );

  function matchesDietary(item: MenuItem) {
    if (dietaryFilters.length === 0) return true;
    return dietaryFilters.every((f) => item.dietary_tags.includes(f));
  }

  function toggleDietary(tag: DietaryTag) {
    if (dietaryFilters.includes(tag)) {
      dietaryFilters = dietaryFilters.filter((t) => t !== tag);
    } else {
      dietaryFilters = [...dietaryFilters, tag];
    }
  }

  let itemsByCategory = $derived(() => {
    const grouped = new Map<string, MenuItem[]>();
    for (const cat of categories) {
      grouped.set(
        cat.id,
        menuItems.filter((item) => item.category_id === cat.id && matchesDietary(item))
      );
    }
    return grouped;
  });

  let paymentValid = $derived.by(() => {
    if (paymentMethod === 'cash') return true;
    if (paymentMethod === 'upi') {
      const v = upiId.trim();
      return v.includes('@') && v.length >= 5;
    }
    const digits = cardNumber.replace(/\s/g, '');
    const expOk = /^\d{2}\/\d{2}$/.test(cardExpiry.trim());
    const cvvOk = /^\d{3,4}$/.test(cardCvv.trim());
    return digits.length >= 12 && expOk && cvvOk;
  });

  let payableTotal = $derived($cartTotal * 1.1);
  let hasActiveOrder = $derived(!!$session.activeOrderId);

  function scrollToCategory(catId: string) {
    activeCategory = catId;
    if (catId === 'all') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(`category-${catId}`);
    if (el) {
      const headerOffset = 170;
      const offsetPosition = el.getBoundingClientRect().top + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  }

  function handleCallWaiter() {
    if (waiterCooldown) {
      showWaiterBanner = true;
      return;
    }
    waiterRequests.add({
      id: generateUUID(),
      restaurant_id: restaurant.id,
      table_id: table.id,
      order_id: $session.activeOrderId,
      status: 'pending',
      message: 'Customer requires assistance',
      acknowledged_at: null,
      resolved_at: null,
      created_at: new Date().toISOString(),
      table
    });
    waiterCalled = true;
    waiterCooldown = true;
    cooldownSeconds = 120;
    showWaiterBanner = true;
    toast.success('Waiter notified');
    setTimeout(() => {
      waiterCalled = false;
    }, 3000);
  }

  function placeOrder() {
    if ($cartCount === 0) return;
    paymentError = '';
    showCheckoutModal = true;
    isCartOpen = false;
  }

  async function handlePayment() {
    paymentError = '';
    if (!paymentValid) {
      paymentError =
        paymentMethod === 'upi'
          ? 'Enter a valid UPI ID (e.g. name@upi).'
          : paymentMethod === 'card'
            ? 'Check card number, expiry (MM/YY), and CVV.'
            : 'Unable to place order.';
      return;
    }

    isProcessingPayment = true;

    if (paymentMethod !== 'cash') {
      await new Promise((resolve) => setTimeout(resolve, 1600));
    }

    try {
      const items = $cart.map((c) => ({
        menu_item_id: c.menu_item.id,
        quantity: c.quantity,
        subtotal: c.menu_item.price * c.quantity
      }));

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
      toast.success('Payment successful — order placed.');
      goto(`/table/${restaurant.id}/${table.id}/order`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to place order. Please try again.';
      paymentError = msg;
      toast.error(msg);
    } finally {
      isProcessingPayment = false;
    }
  }

  function getCartItemQuantity(itemId: string) {
    return $cart.find((i) => i.menu_item.id === itemId)?.quantity || 0;
  }

  function onSheetTouchStart(e: TouchEvent) {
    swipeStartY = e.touches[0].clientY;
    swiping = true;
  }

  function onCartTouchMove(e: TouchEvent) {
    if (!swiping) return;
    const dy = e.touches[0].clientY - swipeStartY;
    cartSheetY = Math.max(0, dy);
  }

  function onCartTouchEnd() {
    swiping = false;
    if (cartSheetY > 90) isCartOpen = false;
    cartSheetY = 0;
  }

  function onCheckoutTouchMove(e: TouchEvent) {
    if (!swiping || isProcessingPayment) return;
    const dy = e.touches[0].clientY - swipeStartY;
    checkoutSheetY = Math.max(0, dy);
  }

  function onCheckoutTouchEnd() {
    swiping = false;
    if (checkoutSheetY > 90 && !isProcessingPayment) showCheckoutModal = false;
    checkoutSheetY = 0;
  }

  function formatCooldown(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
</script>

<svelte:head>
  <title>{restaurant.name} — Menu</title>
</svelte:head>

<!-- Sticky header -->
<header
  class="sg-glass"
  style="position:fixed;top:0;left:0;right:0;z-index:40;border-bottom:1px solid rgba(99,102,241,0.1);"
>
  <div style="padding:14px 16px 10px;display:flex;align-items:flex-start;justify-content:space-between;gap:10px;">
    <div style="min-width:0;">
      <h1 style="font-size:22px;font-weight:900;letter-spacing:-0.04em;color:#1e1b4b;margin:0;line-height:1.1;">
        {restaurant.name}
      </h1>
      <p style="font-size:10px;font-family:'Geist Mono',monospace;color:#8b84c0;letter-spacing:0.08em;text-transform:uppercase;margin:4px 0 0;">
        {table.display_name ?? `Table ${table.table_number}`}
      </p>
    </div>
    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
      <span class="sg-badge-info">{table.display_name ?? `Table ${table.table_number}`}</span>
      {#if hasActiveOrder}
        <a
          class="sg-active-order-chip"
          href="/table/{restaurant.id}/{table.id}/order"
          aria-label="View active order"
        >
          <span style="width:6px;height:6px;border-radius:50%;background:#22c55e;box-shadow:0 0 8px rgba(34,197,94,0.7);" class="sg-pulse"></span>
          <Package size={13} />
          Active order
        </a>
      {/if}
    </div>
  </div>

  <div style="display:flex;overflow-x:auto;padding:0 16px 8px;gap:8px;" class="sg-hide-scrollbar">
    <button
      type="button"
      class="sg-cat-pill {activeCategory === 'all' ? 'sg-cat-pill-active' : ''}"
      style="min-height:40px;"
      onclick={() => scrollToCategory('all')}
    >
      All
    </button>
    {#each categories as category}
      <button
        type="button"
        class="sg-cat-pill {activeCategory === category.id ? 'sg-cat-pill-active' : ''}"
        style="min-height:40px;"
        onclick={() => scrollToCategory(category.id)}
      >
        {category.icon_emoji} {category.name}
      </button>
    {/each}
  </div>

  <!-- Dietary filters -->
  <div style="display:flex;overflow-x:auto;padding:0 16px 12px;gap:8px;" class="sg-hide-scrollbar">
    {#each DIETARY_FILTERS as f}
      <button
        type="button"
        class="sg-filter-pill {dietaryFilters.includes(f.id) ? 'sg-filter-pill-active' : ''}"
        onclick={() => toggleDietary(f.id)}
        aria-pressed={dietaryFilters.includes(f.id)}
      >
        {f.label}
      </button>
    {/each}
  </div>
</header>

<main style="padding:190px 16px calc(110px + env(safe-area-inset-bottom, 0px));max-width:720px;margin:0 auto;">
  {#if !menuReady}
    <!-- Skeletons -->
    <div style="margin-bottom:28px;">
      <div class="sg-skeleton" style="height:12px;width:80px;margin-bottom:14px;"></div>
      <div style="display:flex;gap:12px;overflow:hidden;">
        <div class="sg-skeleton" style="flex:none;width:min(86vw,320px);height:260px;border-radius:24px;"></div>
        <div class="sg-skeleton" style="flex:none;width:240px;height:220px;"></div>
      </div>
    </div>
    {#each [0, 1, 2] as _}
      <div class="sg-tile sg-tile-static" style="padding:12px;display:flex;gap:14px;margin-bottom:12px;">
        <div class="sg-skeleton" style="width:96px;height:96px;flex-shrink:0;"></div>
        <div style="flex:1;display:flex;flex-direction:column;gap:8px;padding:4px 0;">
          <div class="sg-skeleton" style="height:14px;width:70%;"></div>
          <div class="sg-skeleton" style="height:10px;width:90%;"></div>
          <div class="sg-skeleton" style="height:10px;width:40%;margin-top:auto;"></div>
        </div>
      </div>
    {/each}
  {:else}
    {#if featuredItems.length > 0 && activeCategory === 'all'}
      <section style="margin-bottom:32px;">
        <h2 style="font-size:13px;font-family:'Geist Mono',monospace;text-transform:uppercase;letter-spacing:0.08em;color:#8b84c0;margin:0 0 14px;">
          Featured
        </h2>
        <div style="display:flex;overflow-x:auto;gap:14px;padding:4px 2px 10px;perspective:800px;" class="sg-hide-scrollbar">
          {#each featuredItems as item, i}
            <div
              class="{i === 0 ? 'sg-featured-hero' : 'sg-tile sg-featured-side'} sg-stagger"
              style="display:flex;flex-direction:column;gap:10px;--i:{i};position:relative;z-index:1;"
            >
              <div
                style="width:100%;height:{i === 0 ? 160 : 112}px;border-radius:16px;overflow:hidden;position:relative;background:rgba(99,102,241,0.08);"
              >
                <img
                  src={item.image_url}
                  alt={item.name}
                  style="width:100%;height:100%;object-fit:cover;"
                  loading={i === 0 ? 'eager' : 'lazy'}
                  width="320"
                  height="160"
                />
                <div style="position:absolute;top:8px;left:8px;display:flex;gap:4px;flex-wrap:wrap;">
                  {#each item.dietary_tags as tag}
                    <DietaryBadge {tag} />
                  {/each}
                </div>
              </div>
              <div style="flex:1;position:relative;z-index:1;">
                <h3 style="font-size:{i === 0 ? 18 : 15}px;font-weight:800;color:#1e1b4b;margin:0;letter-spacing:-0.02em;">
                  {item.name}
                </h3>
                <p style="font-size:12px;color:#8b84c0;margin:4px 0 0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
                  {item.description}
                </p>
              </div>
              <div style="display:flex;align-items:center;justify-content:space-between;position:relative;z-index:1;">
                <span style="font-weight:800;color:#6366f1;font-size:{i === 0 ? 17 : 14}px;">{formatCurrency(item.price)}</span>
                {#if getCartItemQuantity(item.id) > 0}
                  <div
                    style="display:flex;align-items:center;gap:4px;background:rgba(99,102,241,0.08);border-radius:99px;padding:2px;border:1px solid rgba(99,102,241,0.15);"
                  >
                    <button
                      type="button"
                      class="sg-qty-btn sg-qty-btn-minus"
                      aria-label="Decrease quantity"
                      onclick={() => cart.setQuantity(item.id, getCartItemQuantity(item.id) - 1)}
                    >
                      <Minus size={16} />
                    </button>
                    <span style="min-width:20px;text-align:center;font-weight:700;font-size:14px;">{getCartItemQuantity(item.id)}</span>
                    <button
                      type="button"
                      class="sg-qty-btn sg-qty-btn-plus"
                      aria-label="Increase quantity"
                      onclick={() => cart.setQuantity(item.id, getCartItemQuantity(item.id) + 1)}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                {:else}
                  <button
                    type="button"
                    class="sg-qty-btn-add"
                    aria-label="Add {item.name}"
                    onclick={() => cart.addItem(item, 1)}
                  >
                    <Plus size={18} />
                  </button>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </section>
    {/if}

    {#each categories as category}
      {@const items = itemsByCategory().get(category.id) || []}
      {#if items.length > 0 && (activeCategory === 'all' || activeCategory === category.id)}
        <section id="category-{category.id}" style="margin-bottom:32px;scroll-margin-top:180px;">
          <h2
            style="font-size:18px;font-weight:800;color:#1e1b4b;letter-spacing:-0.02em;margin:0 0 14px;padding-bottom:10px;border-bottom:1px solid rgba(99,102,241,0.1);display:flex;align-items:center;gap:8px;"
          >
            <span>{category.icon_emoji}</span> {category.name}
          </h2>
          <div style="display:flex;flex-direction:column;gap:12px;">
            {#each items as item, ii}
              <div
                class="sg-tile sg-stagger"
                style="padding:12px;display:flex;gap:14px;position:relative;overflow:hidden;--i:{ii};{item.is_available
                  ? ''
                  : 'opacity:0.65;'}"
              >
                {#if !item.is_available}
                  <div
                    style="position:absolute;inset:0;z-index:10;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.45);backdrop-filter:blur(2px);"
                  >
                    <span
                      style="background:#1e1b4b;color:white;padding:6px 12px;border-radius:10px;font-size:11px;font-weight:700;letter-spacing:0.06em;font-family:'Geist Mono',monospace;"
                    >
                      OUT OF STOCK
                    </span>
                  </div>
                {/if}
                <div
                  style="width:96px;height:96px;flex-shrink:0;border-radius:14px;overflow:hidden;background:rgba(99,102,241,0.08);"
                >
                  <img
                    src={item.image_url}
                    alt={item.name}
                    style="width:100%;height:100%;object-fit:cover;"
                    loading="lazy"
                    width="96"
                    height="96"
                  />
                </div>
                <div style="flex:1;display:flex;flex-direction:column;min-width:0;padding:2px 0;">
                  <div style="display:flex;gap:4px;margin-bottom:6px;flex-wrap:wrap;">
                    {#each item.dietary_tags as tag}
                      <DietaryBadge {tag} />
                    {/each}
                  </div>
                  <h3 style="font-size:15px;font-weight:800;color:#1e1b4b;margin:0;letter-spacing:-0.02em;">{item.name}</h3>
                  <p style="font-size:12px;color:#8b84c0;margin:4px 0 0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
                    {item.description}
                  </p>
                  <div style="margin-top:auto;padding-top:8px;display:flex;align-items:center;justify-content:space-between;">
                    <div>
                      <span style="font-weight:800;color:#6366f1;">{formatCurrency(item.price)}</span>
                      {#if item.preparation_time}
                        <div style="font-size:10px;font-family:'Geist Mono',monospace;color:#8b84c0;margin-top:2px;">
                          {item.preparation_time} mins
                        </div>
                      {/if}
                    </div>
                    {#if item.is_available}
                      {#if getCartItemQuantity(item.id) > 0}
                        <div
                          style="display:flex;align-items:center;gap:4px;background:rgba(99,102,241,0.08);border-radius:99px;padding:2px;border:1px solid rgba(99,102,241,0.15);z-index:20;"
                        >
                          <button
                            type="button"
                            class="sg-qty-btn sg-qty-btn-minus"
                            aria-label="Decrease quantity"
                            onclick={() => cart.setQuantity(item.id, getCartItemQuantity(item.id) - 1)}
                          >
                            <Minus size={16} />
                          </button>
                          <span style="min-width:20px;text-align:center;font-weight:700;font-size:13px;">{getCartItemQuantity(item.id)}</span>
                          <button
                            type="button"
                            class="sg-qty-btn sg-qty-btn-plus"
                            aria-label="Increase quantity"
                            onclick={() => cart.setQuantity(item.id, getCartItemQuantity(item.id) + 1)}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      {:else}
                        <button
                          type="button"
                          class="sg-qty-btn-add"
                          style="z-index:20;"
                          aria-label="Add {item.name}"
                          onclick={() => cart.addItem(item, 1)}
                        >
                          <Plus size={18} />
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

    {#if dietaryFilters.length > 0 && featuredItems.length === 0 && categories.every((c) => (itemsByCategory().get(c.id) || []).length === 0)}
      <div class="sg-tile sg-tile-static" style="padding:36px 24px;text-align:center;">
        <p style="font-weight:800;color:#1e1b4b;margin:0 0 6px;">No matches</p>
        <p style="font-size:13px;color:#8b84c0;margin:0 0 16px;">Try clearing a dietary filter.</p>
        <button type="button" class="sg-btn-ghost" onclick={() => (dietaryFilters = [])}>Clear filters</button>
      </div>
    {/if}
  {/if}
</main>

<!-- Waiter confirmation banner -->
{#if showWaiterBanner}
  <div class="sg-waiter-banner" transition:fly={{ y: 24, duration: 280 }} role="status">
    <div
      style="width:40px;height:40px;border-radius:12px;background:rgba(99,102,241,0.12);display:flex;align-items:center;justify-content:center;color:#6366f1;flex-shrink:0;"
    >
      <CheckCircle2 size={20} />
    </div>
    <div style="flex:1;min-width:0;">
      <div style="font-size:14px;font-weight:800;color:#1e1b4b;">Waiter notified</div>
      <div style="font-size:12px;color:#8b84c0;margin-top:2px;">Usually under 2 minutes</div>
      {#if cooldownSeconds > 0}
        <div style="font-size:11px;font-family:'Geist Mono',monospace;color:#6366f1;margin-top:6px;">
          Available again in {formatCooldown(cooldownSeconds)}
        </div>
      {/if}
    </div>
    <button
      type="button"
      class="sg-touch"
      style="width:48px;height:48px;border:none;background:transparent;color:#8b84c0;border-radius:12px;"
      aria-label="Dismiss"
      onclick={() => (showWaiterBanner = false)}
    >
      <X size={18} />
    </button>
  </div>
{/if}

<!-- Thumb-zone action bar -->
{#if !isCartOpen && !showCheckoutModal}
  <div class="sg-thumb-bar" transition:fly={{ y: 40, duration: 250 }}>
    <button
      type="button"
      class="sg-btn-ghost"
      style="min-width:56px;min-height:52px;padding:12px;flex-shrink:0;color:{waiterCalled ? '#6366f1' : '#4338ca'};"
      onclick={handleCallWaiter}
      aria-label="Call waiter"
      title="Call waiter"
    >
      <Bell size={20} />
    </button>

    {#if $cartCount > 0}
      <button
        type="button"
        class="sg-btn-primary"
        style="flex:1;min-height:52px;padding:14px 18px;font-size:15px;justify-content:space-between;"
        onclick={() => (isCartOpen = true)}
      >
        <span style="display:inline-flex;align-items:center;gap:8px;">
          <ShoppingCart size={18} />
          View cart
          <span
            style="background:rgba(255,255,255,0.25);padding:2px 8px;border-radius:99px;font-size:12px;font-weight:800;"
          >
            {$cartCount}
          </span>
        </span>
        <span>{formatCurrency(payableTotal)}</span>
      </button>
    {:else if hasActiveOrder}
      <a
        href="/table/{restaurant.id}/{table.id}/order"
        class="sg-btn-primary"
        style="flex:1;min-height:52px;padding:14px 18px;font-size:15px;text-decoration:none;"
      >
        <Package size={18} /> Track active order
      </a>
    {:else}
      <div
        style="flex:1;min-height:52px;display:flex;align-items:center;justify-content:center;font-size:13px;color:#8b84c0;font-family:'Geist Mono',monospace;"
      >
        Add items to begin
      </div>
    {/if}
  </div>
{/if}

<!-- Cart sheet -->
{#if isCartOpen}
  <div style="position:fixed;inset:0;z-index:50;display:flex;flex-direction:column;justify-content:flex-end;" transition:fade={{ duration: 200 }}>
    <button
      type="button"
      aria-label="Close cart"
      style="position:absolute;inset:0;background:rgba(30,27,75,0.4);backdrop-filter:blur(6px);border:none;cursor:pointer;"
      onclick={() => (isCartOpen = false)}
    ></button>

    <div
      class="sg-glass"
      style="width:100%;max-height:85vh;border-radius:24px 24px 0 0;position:relative;display:flex;flex-direction:column;overflow:hidden;border:1px solid rgba(255,255,255,0.8);box-shadow:0 -8px 40px rgba(99,102,241,0.15);transform:translateY({cartSheetY}px);transition:{swiping
        ? 'none'
        : 'transform 0.25s ease-out'};"
      transition:fly={{ y: 100, duration: 300, opacity: 1 }}
    >
      <div
        role="button"
        tabindex="0"
        aria-label="Swipe down to close cart"
        style="width:100%;display:flex;justify-content:center;padding:14px;cursor:grab;touch-action:none;"
        ontouchstart={onSheetTouchStart}
        ontouchmove={onCartTouchMove}
        ontouchend={onCartTouchEnd}
        onclick={() => (isCartOpen = false)}
        onkeydown={(e) => e.key === 'Enter' && (isCartOpen = false)}
      >
        <div style="width:44px;height:5px;background:rgba(99,102,241,0.28);border-radius:99px;"></div>
      </div>

      <div style="padding:0 20px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(99,102,241,0.1);">
        <h2 style="font-size:22px;font-weight:900;color:#1e1b4b;margin:0;letter-spacing:-0.03em;display:flex;align-items:center;gap:10px;">
          Your Order
          <span class="sg-badge-info">{$cartCount}</span>
        </h2>
        <button
          type="button"
          class="sg-touch"
          style="width:48px;height:48px;border-radius:50%;border:none;background:rgba(99,102,241,0.08);color:#6b6a9c;"
          aria-label="Close cart"
          onclick={() => (isCartOpen = false)}
        >
          <X size={18} />
        </button>
      </div>

      <div style="flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:20px;">
        <div style="display:flex;flex-direction:column;gap:14px;">
          {#each $cart as item}
            <div style="display:flex;align-items:center;gap:12px;">
              <div style="width:56px;height:56px;border-radius:12px;overflow:hidden;background:rgba(99,102,241,0.08);">
                <img src={item.menu_item.image_url} alt={item.menu_item.name} style="width:100%;height:100%;object-fit:cover;" />
              </div>
              <div style="flex:1;min-width:0;">
                <h4 style="font-size:14px;font-weight:700;color:#1e1b4b;margin:0;">{item.menu_item.name}</h4>
                <span style="font-size:13px;font-weight:700;color:#6366f1;">{formatCurrency(item.menu_item.price)}</span>
              </div>
              <div
                style="display:flex;align-items:center;gap:4px;background:rgba(99,102,241,0.08);border-radius:99px;padding:2px;border:1px solid rgba(99,102,241,0.15);"
              >
                <button
                  type="button"
                  class="sg-qty-btn sg-qty-btn-minus"
                  aria-label="Decrease"
                  onclick={() => cart.setQuantity(item.menu_item.id, item.quantity - 1)}
                >
                  <Minus size={16} />
                </button>
                <span style="min-width:20px;text-align:center;font-weight:700;font-size:13px;">{item.quantity}</span>
                <button
                  type="button"
                  class="sg-qty-btn sg-qty-btn-plus"
                  aria-label="Increase"
                  onclick={() => cart.setQuantity(item.menu_item.id, item.quantity + 1)}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          {/each}
        </div>

        <div>
          <label for="instructions" class="sg-label">Special instructions</label>
          <textarea
            id="instructions"
            bind:value={specialInstructions}
            placeholder="Allergies or special requests?"
            class="sg-input"
            style="height:72px;resize:none;"
          ></textarea>
        </div>
      </div>

      <div
        style="padding:16px 20px calc(16px + env(safe-area-inset-bottom, 0px));border-top:1px solid rgba(99,102,241,0.1);background:rgba(255,255,255,0.4);display:flex;flex-direction:column;gap:10px;"
      >
        <div style="display:flex;justify-content:space-between;font-size:13px;color:#8b84c0;">
          <span>Subtotal</span>
          <span>{formatCurrency($cartTotal)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px;color:#8b84c0;">
          <span>Taxes (10%)</span>
          <span>{formatCurrency($cartTotal * 0.1)}</span>
        </div>
        <div
          style="display:flex;justify-content:space-between;font-size:17px;font-weight:800;color:#1e1b4b;padding-top:10px;border-top:1px solid rgba(99,102,241,0.1);"
        >
          <span>Total</span>
          <span style="color:#6366f1;">{formatCurrency(payableTotal)}</span>
        </div>
        <button
          type="button"
          class="sg-btn-primary"
          style="width:100%;min-height:52px;padding:14px;margin-top:6px;font-size:15px;"
          onclick={placeOrder}
        >
          Place Order
        </button>
        <button type="button" class="sg-btn-ghost" style="width:100%;min-height:48px;" onclick={handleCallWaiter}>
          <Bell size={16} /> Need assistance? Call Waiter
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Checkout sheet -->
{#if showCheckoutModal}
  <div
    style="position:fixed;inset:0;z-index:50;display:flex;align-items:flex-end;justify-content:center;"
    transition:fade={{ duration: 200 }}
  >
    <button
      type="button"
      aria-label="Close checkout"
      style="position:absolute;inset:0;background:rgba(30,27,75,0.5);backdrop-filter:blur(8px);border:none;cursor:pointer;"
      onclick={() => !isProcessingPayment && (showCheckoutModal = false)}
    ></button>

    <div
      class="sg-glass"
      style="width:100%;max-width:440px;border-radius:24px 24px 0 0;padding:0 0 calc(16px + env(safe-area-inset-bottom, 0px));position:relative;z-index:10;transform:translateY({checkoutSheetY}px);transition:{swiping
        ? 'none'
        : 'transform 0.25s ease-out'};max-height:90vh;overflow-y:auto;"
      transition:fly={{ y: 80, duration: 280 }}
    >
      <div
        role="button"
        tabindex="0"
        aria-label="Swipe down to close"
        style="width:100%;display:flex;justify-content:center;padding:14px;cursor:grab;touch-action:none;"
        ontouchstart={onSheetTouchStart}
        ontouchmove={onCheckoutTouchMove}
        ontouchend={onCheckoutTouchEnd}
        onclick={() => !isProcessingPayment && (showCheckoutModal = false)}
        onkeydown={(e) => e.key === 'Enter' && !isProcessingPayment && (showCheckoutModal = false)}
      >
        <div style="width:44px;height:5px;background:rgba(99,102,241,0.28);border-radius:99px;"></div>
      </div>

      <div style="padding:0 24px 24px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
          <h3 style="font-size:20px;font-weight:900;color:#1e1b4b;margin:0;letter-spacing:-0.03em;">Payment</h3>
          <button
            type="button"
            class="sg-touch"
            style="width:48px;height:48px;border:none;background:rgba(99,102,241,0.08);border-radius:50%;color:#8b84c0;"
            onclick={() => (showCheckoutModal = false)}
            disabled={isProcessingPayment}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div style="text-align:center;padding:16px 0;border-bottom:1px solid rgba(99,102,241,0.1);margin-bottom:20px;">
          <p style="font-size:12px;font-family:'Geist Mono',monospace;color:#8b84c0;text-transform:uppercase;letter-spacing:0.06em;margin:0;">
            Amount to pay
          </p>
          <p style="font-size:32px;font-weight:900;color:#6366f1;margin:6px 0 0;letter-spacing:-0.04em;">
            {formatCurrency(payableTotal)}
          </p>
        </div>

        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:20px;">
          {#each [{ id: 'upi', label: 'UPI', Icon: Smartphone }, { id: 'card', label: 'Card', Icon: CreditCard }, { id: 'cash', label: 'Cash', Icon: Banknote }] as method}
            <button
              type="button"
              style="display:flex;flex-direction:column;align-items:center;gap:6px;min-height:72px;padding:12px 8px;border-radius:14px;border:1px solid {paymentMethod ===
              method.id
                ? 'rgba(99,102,241,0.4)'
                : 'rgba(99,102,241,0.12)'};background:{paymentMethod === method.id
                ? 'rgba(99,102,241,0.1)'
                : 'rgba(255,255,255,0.5)'};color:{paymentMethod === method.id ? '#4338ca' : '#8b84c0'};cursor:pointer;font-family:'Cabinet Grotesk',system-ui,sans-serif;"
              onclick={() => {
                paymentMethod = method.id as 'upi' | 'card' | 'cash';
                paymentError = '';
              }}
              disabled={isProcessingPayment}
            >
              <method.Icon size={18} />
              <span style="font-size:11px;font-weight:700;">{method.label}</span>
            </button>
          {/each}
        </div>

        <div style="min-height:100px;display:flex;flex-direction:column;justify-content:center;margin-bottom:12px;gap:10px;">
          {#if paymentMethod === 'upi'}
            <label class="sg-label" for="upi-input">UPI ID</label>
            <input
              id="upi-input"
              type="text"
              class="sg-input"
              bind:value={upiId}
              placeholder="name@upi"
              autocomplete="off"
              disabled={isProcessingPayment}
            />
          {:else if paymentMethod === 'card'}
            <label class="sg-label" for="card-number">Card number</label>
            <input
              id="card-number"
              type="text"
              class="sg-input"
              bind:value={cardNumber}
              inputmode="numeric"
              placeholder="Card number"
              disabled={isProcessingPayment}
            />
            <div style="display:flex;gap:10px;">
              <div style="flex:1;">
                <label class="sg-label" for="card-exp">Expiry</label>
                <input
                  id="card-exp"
                  type="text"
                  class="sg-input"
                  bind:value={cardExpiry}
                  placeholder="MM/YY"
                  disabled={isProcessingPayment}
                />
              </div>
              <div style="flex:1;">
                <label class="sg-label" for="card-cvv">CVV</label>
                <input
                  id="card-cvv"
                  type="password"
                  class="sg-input"
                  bind:value={cardCvv}
                  inputmode="numeric"
                  placeholder="CVV"
                  disabled={isProcessingPayment}
                />
              </div>
            </div>
          {:else}
            <p style="text-align:center;font-size:13px;color:#8b84c0;margin:0;">
              A waiter will collect cash at your table.
            </p>
          {/if}
        </div>

        {#if paymentError}
          <div
            style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);color:#dc2626;padding:12px 14px;border-radius:12px;margin-bottom:12px;font-size:13px;"
            role="alert"
          >
            {paymentError}
          </div>
        {/if}

        {#if isProcessingPayment}
          <p style="text-align:center;font-size:12px;font-family:'Geist Mono',monospace;color:#8b84c0;margin:0 0 10px;">
            Confirming payment…
          </p>
        {/if}

        <button
          type="button"
          class="sg-btn-primary"
          style="width:100%;min-height:52px;padding:14px;font-size:15px;"
          onclick={handlePayment}
          disabled={isProcessingPayment || !paymentValid}
        >
          {#if isProcessingPayment}
            <div
              style="width:22px;height:22px;border:2px solid rgba(255,255,255,0.3);border-top-color:white;border-radius:50%;animation:spin 0.7s linear infinite;"
            ></div>
          {:else}
            {paymentMethod === 'cash' ? 'Place Order (Cash)' : 'Confirm Payment'}
          {/if}
        </button>

        {#if paymentError && !isProcessingPayment}
          <button type="button" class="sg-btn-ghost" style="width:100%;min-height:48px;margin-top:8px;" onclick={handlePayment}>
            Retry payment
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
