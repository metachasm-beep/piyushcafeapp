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
    CheckCircle2,
    Trash2
  } from '@lucide/svelte';
  import { toast } from 'svelte-sonner';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  import { session } from '$lib/stores/session';
  import { cart, cartCount, cartTotal } from '$lib/stores/cart';
  import { waiterRequests } from '$lib/stores/admin';
  import { formatCurrency, generateUUID } from '$lib/utils';

  import DietaryBadge from '$lib/components/DietaryBadge.svelte';
  import FeaturedCarousel from '$lib/components/FeaturedCarousel.svelte';
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
  let expandedIds = $state<Set<string>>(new Set());
  let popIds = $state<Set<string>>(new Set());

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

  function toggleExpand(id: string) {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    expandedIds = next;
  }

  function addWithFeedback(item: MenuItem) {
    cart.addItem(item, 1);
    const next = new Set(popIds);
    next.add(item.id);
    popIds = next;
    setTimeout(() => {
      const cleared = new Set(popIds);
      cleared.delete(item.id);
      popIds = cleared;
    }, 500);
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
      const headerOffset = 148;
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

<header class="sg-glass menu-header">
  <div class="menu-header__top">
    <div class="menu-header__brand">
      <h1 class="sg-title-balance">{restaurant.name}</h1>
      <p>{table.display_name ?? `Table ${table.table_number}`}</p>
    </div>
    {#if hasActiveOrder}
      <a
        class="sg-active-order-chip"
        href="/table/{restaurant.id}/{table.id}/order"
        aria-label="View active order"
      >
        <span class="menu-header__dot sg-pulse"></span>
        <Package size={13} />
        Active order
      </a>
    {/if}
  </div>

  <div class="menu-header__cats sg-hide-scrollbar">
    <button
      type="button"
      class="sg-cat-pill {activeCategory === 'all' ? 'sg-cat-pill-active' : ''}"
      onclick={() => scrollToCategory('all')}
    >
      All
    </button>
    {#each categories as category}
      <button
        type="button"
        class="sg-cat-pill {activeCategory === category.id ? 'sg-cat-pill-active' : ''}"
        onclick={() => scrollToCategory(category.id)}
      >
        {category.icon_emoji} {category.name}
      </button>
    {/each}
  </div>

  <div class="menu-header__filters sg-hide-scrollbar">
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

<main class="menu-main">
  {#if !menuReady}
    <div class="menu-skel">
      <div class="sg-skeleton" style="height:12px;width:80px;margin-bottom:14px;"></div>
      <div class="sg-skeleton" style="width:100%;aspect-ratio:16/10;border-radius:22px;margin-bottom:12px;"></div>
      <div class="sg-skeleton" style="height:18px;width:55%;margin-bottom:8px;"></div>
      <div class="sg-skeleton" style="height:12px;width:80%;"></div>
    </div>
    {#each [0, 1, 2] as _}
      <div class="sg-tile sg-tile-static menu-row menu-row--skel">
        <div class="sg-skeleton menu-row__thumb"></div>
        <div class="menu-row__skel-body">
          <div class="sg-skeleton" style="height:14px;width:70%;"></div>
          <div class="sg-skeleton" style="height:10px;width:40%;margin-top:auto;"></div>
        </div>
      </div>
    {/each}
  {:else}
    {#if featuredItems.length > 0 && activeCategory === 'all'}
      <FeaturedCarousel
        items={featuredItems}
        getQuantity={getCartItemQuantity}
        onAdd={addWithFeedback}
        onSetQuantity={(id, qty) => cart.setQuantity(id, qty)}
      />
    {/if}

    {#each categories as category}
      {@const items = itemsByCategory().get(category.id) || []}
      {#if items.length > 0 && (activeCategory === 'all' || activeCategory === category.id)}
        <section id="category-{category.id}" class="menu-section">
          <h2 class="menu-section__label sg-title-balance">
            <span>{category.icon_emoji}</span> {category.name}
          </h2>
          <div class="menu-section__list">
            {#each items as item, ii}
              {@const expanded = expandedIds.has(item.id)}
              <div
                class="sg-tile sg-stagger menu-row"
                style="--i:{ii};{item.is_available ? '' : 'opacity:0.65;'}"
              >
                {#if !item.is_available}
                  <div class="menu-row__oos">
                    <span>OUT OF STOCK</span>
                  </div>
                {/if}
                <div class="sg-media menu-row__thumb">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    loading="lazy"
                    width="72"
                    height="72"
                  />
                </div>
                <div class="menu-row__body">
                  <button
                    type="button"
                    class="menu-row__main"
                    onclick={() => toggleExpand(item.id)}
                    aria-expanded={expanded}
                  >
                    <h3 class="sg-title-balance">{item.name}</h3>
                    {#if expanded}
                      <p class="sg-text-pretty">{item.description}</p>
                      {#if item.dietary_tags.length}
                        <div class="menu-row__tags">
                          {#each item.dietary_tags as tag}
                            <DietaryBadge {tag} />
                          {/each}
                        </div>
                      {/if}
                    {/if}
                  </button>
                  <div class="menu-row__meta">
                    <div>
                      <span class="menu-row__price sg-num">{formatCurrency(item.price)}</span>
                      {#if item.preparation_time && expanded}
                        <div class="menu-row__time sg-num">{item.preparation_time} mins</div>
                      {/if}
                    </div>
                    {#if item.is_available}
                      {#if getCartItemQuantity(item.id) > 0}
                        <div class="menu-row__qty">
                          <button
                            type="button"
                            class="sg-qty-btn sg-qty-btn-minus"
                            aria-label="Decrease quantity"
                            onclick={() => cart.setQuantity(item.id, getCartItemQuantity(item.id) - 1)}
                          >
                            <Minus size={16} />
                          </button>
                          <span class="sg-num">{getCartItemQuantity(item.id)}</span>
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
                          class="sg-qty-btn-add {popIds.has(item.id) ? 'is-pop' : ''}"
                          aria-label="Add {item.name}"
                          onclick={() => addWithFeedback(item)}
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
      <div class="sg-tile sg-tile-static menu-empty">
        <p class="menu-empty__title">No matches</p>
        <p class="menu-empty__copy sg-text-pretty">Try clearing a dietary filter.</p>
        <button type="button" class="sg-btn-ghost" onclick={() => (dietaryFilters = [])}>Clear filters</button>
      </div>
    {/if}
  {/if}
</main>

{#if showWaiterBanner}
  <div class="sg-waiter-banner" transition:fly={{ y: 24, duration: 280 }} role="status">
    <div class="waiter-icon">
      <CheckCircle2 size={20} />
    </div>
    <div class="waiter-copy">
      <div class="waiter-copy__title">Waiter notified</div>
      <div class="waiter-copy__sub">Usually under 2 minutes</div>
      {#if cooldownSeconds > 0}
        <div class="waiter-copy__eta sg-num">Available again in {formatCooldown(cooldownSeconds)}</div>
      {/if}
    </div>
    <button
      type="button"
      class="sg-touch waiter-dismiss"
      aria-label="Dismiss"
      onclick={() => (showWaiterBanner = false)}
    >
      <X size={18} />
    </button>
  </div>
{/if}

{#if !isCartOpen && !showCheckoutModal}
  <div class="sg-thumb-bar" transition:fly={{ y: 40, duration: 250 }}>
    <button
      type="button"
      class="sg-btn-ghost thumb-waiter"
      style="color:{waiterCalled ? 'var(--sg-accent)' : 'var(--sg-accent-strong)'};"
      onclick={handleCallWaiter}
      aria-label="Call waiter"
      title="Call waiter"
    >
      <Bell size={20} />
    </button>

    {#if $cartCount > 0}
      <button
        type="button"
        class="sg-btn-primary thumb-cart"
        onclick={() => (isCartOpen = true)}
      >
        <span class="thumb-cart__left">
          <ShoppingCart size={18} />
          View cart
          <span class="thumb-cart__count sg-num">{$cartCount}</span>
        </span>
        <span class="sg-num">{formatCurrency(payableTotal)}</span>
      </button>
    {:else if hasActiveOrder}
      <a
        href="/table/{restaurant.id}/{table.id}/order"
        class="sg-btn-primary thumb-cart"
      >
        <Package size={18} /> Track active order
      </a>
    {:else}
      <div class="thumb-hint">Add items to begin</div>
    {/if}
  </div>
{/if}

{#if isCartOpen}
  <div class="sheet-root" transition:fade={{ duration: 180 }}>
    <button
      type="button"
      class="sheet-scrim"
      aria-label="Close cart"
      onclick={() => (isCartOpen = false)}
    ></button>

    <div
      class="sg-glass sg-sheet"
      style="transform:translateY({cartSheetY}px);transition:{swiping
        ? 'none'
        : 'transform var(--sg-duration-sheet) var(--sg-ease)'};"
      transition:fly={{ y: 100, duration: 300, opacity: 1 }}
      role="dialog"
      aria-modal="true"
      aria-label="Your order"
    >
      <div
        class="sg-sheet-handle"
        role="button"
        tabindex="0"
        aria-label="Swipe down to close cart"
        ontouchstart={onSheetTouchStart}
        ontouchmove={onCartTouchMove}
        ontouchend={onCartTouchEnd}
        onclick={() => (isCartOpen = false)}
        onkeydown={(e) => e.key === 'Enter' && (isCartOpen = false)}
      >
        <div class="sg-sheet-handle__bar"></div>
      </div>

      <div class="sg-sheet-header">
        <h2>
          Your Order
          {#if $cartCount > 0}
            <span class="sg-badge-info sg-num">{$cartCount}</span>
          {/if}
        </h2>
        <button
          type="button"
          class="sg-touch sheet-close"
          aria-label="Close cart"
          onclick={() => (isCartOpen = false)}
        >
          <X size={18} />
        </button>
      </div>

      <div class="sheet-body">
        {#if $cartCount === 0}
          <div class="sg-empty-cart">
            <div class="sg-empty-cart__icon">
              <ShoppingCart size={28} />
            </div>
            <h3>Your cart is empty</h3>
            <p>Browse the menu and add dishes when you’re ready.</p>
            <button type="button" class="sg-btn-primary" onclick={() => (isCartOpen = false)}>
              Back to menu
            </button>
          </div>
        {:else}
          <div class="cart-lines">
            {#each $cart as item}
              <div class="sg-cart-line">
                <div class="sg-media cart-thumb">
                  <img src={item.menu_item.image_url} alt={item.menu_item.name} />
                </div>
                <div class="cart-line__info">
                  <h4 class="sg-title-balance">{item.menu_item.name}</h4>
                  <span class="sg-num">{formatCurrency(item.menu_item.price)}</span>
                </div>
                <div class="menu-row__qty">
                  <button
                    type="button"
                    class="sg-qty-btn sg-qty-btn-minus"
                    aria-label="Decrease"
                    onclick={() => cart.setQuantity(item.menu_item.id, item.quantity - 1)}
                  >
                    <Minus size={16} />
                  </button>
                  <span class="sg-num">{item.quantity}</span>
                  <button
                    type="button"
                    class="sg-qty-btn sg-qty-btn-plus"
                    aria-label="Increase"
                    onclick={() => cart.setQuantity(item.menu_item.id, item.quantity + 1)}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <button
                  type="button"
                  class="sg-cart-line__remove"
                  aria-label="Remove {item.menu_item.name}"
                  onclick={() => cart.removeItem(item.menu_item.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            {/each}
          </div>

          <div>
            <label for="instructions" class="sg-label">Special instructions</label>
            <textarea
              id="instructions"
              bind:value={specialInstructions}
              placeholder="Allergies or special requests?"
              class="sg-input sheet-notes"
            ></textarea>
          </div>
        {/if}
      </div>

      {#if $cartCount > 0}
        <div class="sheet-footer">
          <div class="sheet-totals">
            <div class="sheet-totals__row">
              <span>Subtotal</span>
              <span class="sg-num">{formatCurrency($cartTotal)}</span>
            </div>
            <div class="sheet-totals__row">
              <span>Taxes (10%)</span>
              <span class="sg-num">{formatCurrency($cartTotal * 0.1)}</span>
            </div>
            <div class="sheet-totals__total">
              <span>Total</span>
              <span class="sg-num">{formatCurrency(payableTotal)}</span>
            </div>
          </div>
          <button type="button" class="sg-btn-primary sheet-cta" onclick={placeOrder}>
            Place Order
          </button>
          <button type="button" class="sg-btn-ghost sheet-assist" onclick={handleCallWaiter}>
            <Bell size={16} /> Need assistance? Call Waiter
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}

{#if showCheckoutModal}
  <div class="sheet-root sheet-root--center" transition:fade={{ duration: 180 }}>
    <button
      type="button"
      class="sheet-scrim"
      aria-label="Close checkout"
      onclick={() => !isProcessingPayment && (showCheckoutModal = false)}
    ></button>

    <div
      class="sg-glass sg-sheet checkout-sheet"
      style="transform:translateY({checkoutSheetY}px);transition:{swiping
        ? 'none'
        : 'transform var(--sg-duration-sheet) var(--sg-ease)'};"
      transition:fly={{ y: 80, duration: 280 }}
      role="dialog"
      aria-modal="true"
      aria-label="Payment"
    >
      <div
        class="sg-sheet-handle"
        role="button"
        tabindex="0"
        aria-label="Swipe down to close"
        ontouchstart={onSheetTouchStart}
        ontouchmove={onCheckoutTouchMove}
        ontouchend={onCheckoutTouchEnd}
        onclick={() => !isProcessingPayment && (showCheckoutModal = false)}
        onkeydown={(e) => e.key === 'Enter' && !isProcessingPayment && (showCheckoutModal = false)}
      >
        <div class="sg-sheet-handle__bar"></div>
      </div>

      <div class="checkout-body">
        <div class="sg-sheet-header checkout-header">
          <h3>Payment</h3>
          <button
            type="button"
            class="sg-touch sheet-close"
            onclick={() => (showCheckoutModal = false)}
            disabled={isProcessingPayment}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div class="checkout-amount">
          <p>Amount to pay</p>
          <p class="checkout-amount__value sg-num">{formatCurrency(payableTotal)}</p>
        </div>

        <div class="checkout-methods">
          {#each [{ id: 'upi', label: 'UPI', Icon: Smartphone }, { id: 'card', label: 'Card', Icon: CreditCard }, { id: 'cash', label: 'Cash', Icon: Banknote }] as method}
            <button
              type="button"
              class="sg-pay-tile {paymentMethod === method.id ? 'is-active' : ''}"
              onclick={() => {
                paymentMethod = method.id as 'upi' | 'card' | 'cash';
                paymentError = '';
              }}
              disabled={isProcessingPayment}
            >
              <method.Icon size={18} />
              <span>{method.label}</span>
            </button>
          {/each}
        </div>

        <div class="checkout-fields">
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
            <div class="checkout-card-row">
              <div>
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
              <div>
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
            <p class="checkout-cash sg-text-pretty">A waiter will collect cash at your table.</p>
          {/if}
        </div>

        {#if paymentError}
          <div class="checkout-error" role="alert">{paymentError}</div>
        {/if}

        {#if isProcessingPayment}
          <p class="checkout-pending">Confirming payment…</p>
        {/if}

        <button
          type="button"
          class="sg-btn-primary sheet-cta"
          onclick={handlePayment}
          disabled={isProcessingPayment || !paymentValid}
        >
          {#if isProcessingPayment}
            <div class="spin"></div>
          {:else}
            {paymentMethod === 'cash' ? 'Place Order (Cash)' : 'Confirm Payment'}
          {/if}
        </button>

        {#if paymentError && !isProcessingPayment}
          <button type="button" class="sg-btn-ghost sheet-assist" onclick={handlePayment}>
            Retry payment
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .menu-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 40;
    border-bottom: 1px solid var(--sg-line);
  }

  .menu-header__top {
    padding: 10px 16px 6px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
  }

  .menu-header__brand {
    min-width: 0;
  }

  .menu-header__brand h1 {
    font-size: 20px;
    font-weight: 900;
    letter-spacing: -0.04em;
    color: var(--sg-ink);
    margin: 0;
    line-height: 1.15;
  }

  .menu-header__brand p {
    font-size: 10px;
    font-family: var(--sg-font-mono);
    color: var(--sg-muted);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin: 3px 0 0;
  }

  .menu-header__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--sg-success);
    box-shadow: 0 0 8px rgba(47, 122, 74, 0.5);
  }

  .menu-header__cats {
    display: flex;
    overflow-x: auto;
    padding: 0 16px 6px;
    gap: 6px;
  }

  .menu-header__filters {
    display: flex;
    overflow-x: auto;
    padding: 0 16px 8px;
    gap: 6px;
  }

  .menu-main {
    padding: 148px 16px calc(110px + env(safe-area-inset-bottom, 0px));
    max-width: 720px;
    margin: 0 auto;
  }

  .menu-skel {
    margin-bottom: 28px;
  }

  .menu-section {
    margin-bottom: 28px;
    scroll-margin-top: 148px;
  }

  .menu-section__label {
    position: sticky;
    top: 132px;
    z-index: 20;
    font-size: 13px;
    font-weight: 800;
    color: var(--sg-ink);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    margin: 0 0 10px;
    padding: 8px 0;
    background: linear-gradient(
      180deg,
      rgba(242, 235, 227, 0.96) 0%,
      rgba(242, 235, 227, 0.88) 70%,
      transparent 100%
    );
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--sg-font-mono);
  }

  .menu-section__list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .menu-row {
    padding: 10px;
    display: flex;
    gap: 12px;
    position: relative;
    overflow: hidden;
    border-radius: var(--sg-radius-lg);
  }

  .menu-row--skel {
    margin-bottom: 8px;
  }

  .menu-row__oos {
    position: absolute;
    inset: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 252, 247, 0.5);
    backdrop-filter: blur(2px);
  }

  .menu-row__oos span {
    background: var(--sg-ink);
    color: white;
    padding: 6px 12px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    font-family: var(--sg-font-mono);
  }

  .menu-row__thumb {
    width: 72px;
    height: 72px;
    flex-shrink: 0;
    border-radius: calc(var(--sg-radius-lg) - 10px);
  }

  .menu-row__skel-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 4px 0;
  }

  .menu-row__body {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    gap: 6px;
  }

  .menu-row__main {
    display: block;
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    font-family: inherit;
    color: inherit;
  }

  .menu-row__main:focus-visible {
    outline: 2px solid var(--sg-accent);
    outline-offset: 2px;
    border-radius: 6px;
  }

  .menu-row__main h3 {
    font-size: 14px;
    font-weight: 800;
    color: var(--sg-ink);
    margin: 0;
    letter-spacing: -0.02em;
  }

  .menu-row__main p {
    font-size: 12px;
    color: var(--sg-muted);
    margin: 6px 0 0;
    line-height: 1.4;
  }

  .menu-row__tags {
    display: flex;
    gap: 4px;
    margin-top: 8px;
    flex-wrap: wrap;
  }

  .menu-row__meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: auto;
    gap: 8px;
  }

  .menu-row__price {
    font-weight: 800;
    color: var(--sg-accent);
    font-size: 14px;
  }

  .menu-row__time {
    font-size: 10px;
    font-family: var(--sg-font-mono);
    color: var(--sg-muted);
    margin-top: 2px;
  }

  .menu-row__qty {
    display: flex;
    align-items: center;
    gap: 2px;
    background: var(--sg-accent-soft);
    border-radius: var(--sg-radius-pill);
    padding: 2px;
    border: 1px solid var(--sg-accent-border);
    z-index: 20;
  }

  .menu-row__qty span {
    min-width: 20px;
    text-align: center;
    font-weight: 700;
    font-size: 13px;
  }

  .menu-empty {
    padding: 36px 24px;
    text-align: center;
  }

  .menu-empty__title {
    font-weight: 800;
    color: var(--sg-ink);
    margin: 0 0 6px;
  }

  .menu-empty__copy {
    font-size: 13px;
    color: var(--sg-muted);
    margin: 0 0 16px;
  }

  .waiter-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: var(--sg-accent-soft);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--sg-accent);
    flex-shrink: 0;
  }

  .waiter-copy {
    flex: 1;
    min-width: 0;
  }

  .waiter-copy__title {
    font-size: 14px;
    font-weight: 800;
    color: var(--sg-ink);
  }

  .waiter-copy__sub {
    font-size: 12px;
    color: var(--sg-muted);
    margin-top: 2px;
  }

  .waiter-copy__eta {
    font-size: 11px;
    font-family: var(--sg-font-mono);
    color: var(--sg-accent);
    margin-top: 6px;
  }

  .waiter-dismiss {
    width: 48px;
    height: 48px;
    border: none;
    background: transparent;
    color: var(--sg-muted);
    border-radius: 12px;
  }

  .thumb-waiter {
    min-width: 56px;
    min-height: 52px;
    padding: 12px;
    flex-shrink: 0;
  }

  .thumb-cart {
    flex: 1;
    min-height: 52px;
    padding: 14px 18px;
    font-size: 15px;
    justify-content: space-between;
    text-decoration: none;
  }

  .thumb-cart__left {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .thumb-cart__count {
    background: rgba(255, 255, 255, 0.22);
    padding: 2px 8px;
    border-radius: 99px;
    font-size: 12px;
    font-weight: 800;
  }

  .thumb-hint {
    flex: 1;
    min-height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    color: var(--sg-muted);
    font-family: var(--sg-font-mono);
  }

  .sheet-root {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
  }

  .sheet-root--center {
    align-items: stretch;
  }

  .sheet-scrim {
    position: absolute;
    inset: 0;
    background: rgba(26, 22, 20, 0.4);
    backdrop-filter: blur(6px);
    border: none;
    cursor: pointer;
    padding: 0;
  }

  .sheet-close {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: none;
    background: var(--sg-accent-soft);
    color: var(--sg-muted);
  }

  .sheet-body {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .cart-lines {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .cart-thumb {
    width: 56px;
    height: 56px;
    border-radius: calc(var(--sg-radius-lg) - 12px);
    flex-shrink: 0;
  }

  .cart-line__info {
    flex: 1;
    min-width: 0;
  }

  .cart-line__info h4 {
    font-size: 14px;
    font-weight: 700;
    color: var(--sg-ink);
    margin: 0;
  }

  .cart-line__info span {
    font-size: 13px;
    font-weight: 700;
    color: var(--sg-accent);
  }

  .sheet-notes {
    height: 72px;
    resize: none;
  }

  .sheet-footer {
    padding: 16px 20px calc(16px + env(safe-area-inset-bottom, 0px));
    border-top: 1px solid var(--sg-line);
    background: rgba(255, 252, 247, 0.45);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .sheet-totals__row {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    color: var(--sg-muted);
  }

  .sheet-totals__total {
    display: flex;
    justify-content: space-between;
    font-size: 17px;
    font-weight: 800;
    color: var(--sg-ink);
    padding-top: 10px;
    border-top: 1px solid var(--sg-line);
  }

  .sheet-totals__total .sg-num {
    color: var(--sg-accent);
  }

  .sheet-cta {
    width: 100%;
    min-height: 52px;
    padding: 14px;
    margin-top: 6px;
    font-size: 15px;
  }

  .sheet-assist {
    width: 100%;
    min-height: 48px;
  }

  .checkout-sheet {
    max-width: 440px;
    margin: 0 auto;
    max-height: 90vh;
    overflow-y: auto;
  }

  .checkout-body {
    padding: 0 24px calc(16px + env(safe-area-inset-bottom, 0px));
  }

  .checkout-header {
    padding: 0 0 16px;
    border-bottom: none;
    margin-bottom: 4px;
  }

  .checkout-amount {
    text-align: center;
    padding: 12px 0 18px;
    border-bottom: 1px solid var(--sg-line);
    margin-bottom: 18px;
  }

  .checkout-amount p:first-child {
    font-size: 11px;
    font-family: var(--sg-font-mono);
    color: var(--sg-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin: 0;
  }

  .checkout-amount__value {
    font-size: 28px;
    font-weight: 900;
    color: var(--sg-accent);
    margin: 6px 0 0;
    letter-spacing: -0.04em;
  }

  .checkout-methods {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 18px;
  }

  .checkout-fields {
    min-height: 96px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin-bottom: 12px;
    gap: 10px;
  }

  .checkout-card-row {
    display: flex;
    gap: 10px;
  }

  .checkout-card-row > div {
    flex: 1;
  }

  .checkout-cash {
    text-align: center;
    font-size: 13px;
    color: var(--sg-muted);
    margin: 0;
  }

  .checkout-error {
    background: rgba(192, 57, 43, 0.08);
    border: 1px solid rgba(192, 57, 43, 0.2);
    color: var(--sg-danger);
    padding: 12px 14px;
    border-radius: 12px;
    margin-bottom: 12px;
    font-size: 13px;
  }

  .checkout-pending {
    text-align: center;
    font-size: 12px;
    font-family: var(--sg-font-mono);
    color: var(--sg-muted);
    margin: 0 0 10px;
  }

  .spin {
    width: 22px;
    height: 22px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .spin {
      animation: none;
    }
  }
</style>
