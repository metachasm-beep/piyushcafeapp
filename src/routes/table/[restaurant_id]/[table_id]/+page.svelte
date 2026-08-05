<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { ShoppingCart, Bell, Plus, Minus, X, Smartphone, CreditCard, Banknote } from '@lucide/svelte';
  import { toast } from 'svelte-sonner';
  import { goto } from '$app/navigation';

  import { session } from '$lib/stores/session';
  import { cart, cartCount, cartTotal } from '$lib/stores/cart';
  import { waiterRequests } from '$lib/stores/admin';
  import { formatCurrency, generateUUID } from '$lib/utils';

  import DietaryBadge from '$lib/components/DietaryBadge.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  let restaurant = $derived(data.restaurant);
  let table = $derived(data.table);
  let categories = $derived(data.categories);
  let menuItems = $derived(data.menuItems);

  $effect(() => {
    session.init(restaurant, table);
  });

  let activeCategory = $state('all');
  let isCartOpen = $state(false);
  let showCheckoutModal = $state(false);
  let paymentMethod = $state<'upi' | 'card' | 'cash'>('upi');
  let isProcessingPayment = $state(false);
  let specialInstructions = $state('');

  let waiterCalled = $state(false);
  let waiterCooldown = $state(false);

  let featuredItems = $derived(menuItems.filter((item) => item.is_featured && item.is_available));
  let itemsByCategory = $derived(() => {
    const grouped = new Map();
    for (const cat of categories) {
      grouped.set(
        cat.id,
        menuItems.filter((item) => item.category_id === cat.id)
      );
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
      const headerOffset = 130;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
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
    toast.success('Waiter called — someone will be with you shortly.');
    waiterCalled = true;
    waiterCooldown = true;
    setTimeout(() => {
      waiterCalled = false;
    }, 3000);
    setTimeout(() => {
      waiterCooldown = false;
    }, 60000);
  }

  function placeOrder() {
    if ($cartCount === 0) return;
    showCheckoutModal = true;
    isCartOpen = false;
  }

  async function handlePayment() {
    isProcessingPayment = true;

    if (paymentMethod !== 'cash') {
      await new Promise((resolve) => setTimeout(resolve, 2000));
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
      toast.error(msg);
    } finally {
      isProcessingPayment = false;
    }
  }

  function getCartItemQuantity(itemId: string) {
    return $cart.find((i) => i.menu_item.id === itemId)?.quantity || 0;
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
  <div style="padding:16px 20px 12px;display:flex;align-items:center;justify-content:space-between;gap:12px;">
    <div>
      <h1 style="font-size:22px;font-weight:900;letter-spacing:-0.04em;color:#1e1b4b;margin:0;line-height:1.1;">
        {restaurant.name}
      </h1>
      <p style="font-size:10px;font-family:'Geist Mono',monospace;color:#8b84c0;letter-spacing:0.08em;text-transform:uppercase;margin:4px 0 0;">
        Demo menu template
      </p>
    </div>
    <span class="sg-badge-info">
      {table.display_name ?? `Table ${table.table_number}`}
    </span>
  </div>

  <div style="display:flex;overflow-x:auto;padding:0 16px 12px;gap:8px;" class="sg-hide-scrollbar">
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
</header>

<main style="padding:140px 16px 120px;max-width:720px;margin:0 auto;">
  {#if featuredItems.length > 0 && activeCategory === 'all'}
    <section style="margin-bottom:32px;">
      <h2 style="font-size:13px;font-family:'Geist Mono',monospace;text-transform:uppercase;letter-spacing:0.08em;color:#8b84c0;margin:0 0 14px;">
        Featured
      </h2>
      <div style="display:flex;overflow-x:auto;gap:12px;padding-bottom:4px;" class="sg-hide-scrollbar">
        {#each featuredItems as item}
          <div class="sg-tile" style="flex:none;width:260px;padding:12px;display:flex;flex-direction:column;gap:10px;">
            <div style="width:100%;height:120px;border-radius:14px;overflow:hidden;position:relative;background:rgba(99,102,241,0.08);">
              <img src={item.image_url} alt={item.name} style="width:100%;height:100%;object-fit:cover;" loading="lazy" />
              <div style="position:absolute;top:8px;left:8px;display:flex;gap:4px;flex-wrap:wrap;">
                {#each item.dietary_tags as tag}
                  <DietaryBadge {tag} />
                {/each}
              </div>
            </div>
            <div style="flex:1;">
              <h3 style="font-size:16px;font-weight:800;color:#1e1b4b;margin:0;letter-spacing:-0.02em;">{item.name}</h3>
              <p style="font-size:12px;color:#8b84c0;margin:4px 0 0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
                {item.description}
              </p>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <span style="font-weight:800;color:#6366f1;">{formatCurrency(item.price)}</span>
              {#if getCartItemQuantity(item.id) > 0}
                <div
                  style="display:flex;align-items:center;gap:6px;background:rgba(99,102,241,0.08);border-radius:99px;padding:4px;border:1px solid rgba(99,102,241,0.15);"
                >
                  <button
                    type="button"
                    style="width:28px;height:28px;border-radius:50%;border:none;background:white;color:#4338ca;display:flex;align-items:center;justify-content:center;cursor:pointer;"
                    onclick={() => cart.setQuantity(item.id, getCartItemQuantity(item.id) - 1)}
                  >
                    <Minus size={14} />
                  </button>
                  <span style="width:16px;text-align:center;font-weight:700;font-size:13px;">{getCartItemQuantity(item.id)}</span>
                  <button
                    type="button"
                    style="width:28px;height:28px;border-radius:50%;border:none;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;display:flex;align-items:center;justify-content:center;cursor:pointer;"
                    onclick={() => cart.setQuantity(item.id, getCartItemQuantity(item.id) + 1)}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              {:else}
                <button
                  type="button"
                  style="width:32px;height:32px;border-radius:50%;border:none;background:rgba(99,102,241,0.12);color:#6366f1;display:flex;align-items:center;justify-content:center;cursor:pointer;"
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
      <section id="category-{category.id}" style="margin-bottom:32px;scroll-margin-top:140px;">
        <h2
          style="font-size:18px;font-weight:800;color:#1e1b4b;letter-spacing:-0.02em;margin:0 0 14px;padding-bottom:10px;border-bottom:1px solid rgba(99,102,241,0.1);display:flex;align-items:center;gap:8px;"
        >
          <span>{category.icon_emoji}</span> {category.name}
        </h2>
        <div style="display:flex;flex-direction:column;gap:12px;">
          {#each items as item}
            <div
              class="sg-tile"
              style="padding:12px;display:flex;gap:14px;position:relative;overflow:hidden;{item.is_available
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
                <img src={item.image_url} alt={item.name} style="width:100%;height:100%;object-fit:cover;" loading="lazy" />
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
                        style="display:flex;align-items:center;gap:6px;background:rgba(99,102,241,0.08);border-radius:99px;padding:3px;border:1px solid rgba(99,102,241,0.15);z-index:20;"
                      >
                        <button
                          type="button"
                          style="width:26px;height:26px;border-radius:50%;border:none;background:white;color:#4338ca;display:flex;align-items:center;justify-content:center;cursor:pointer;"
                          onclick={() => cart.setQuantity(item.id, getCartItemQuantity(item.id) - 1)}
                        >
                          <Minus size={12} />
                        </button>
                        <span style="width:14px;text-align:center;font-weight:700;font-size:12px;">{getCartItemQuantity(item.id)}</span>
                        <button
                          type="button"
                          style="width:26px;height:26px;border-radius:50%;border:none;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;display:flex;align-items:center;justify-content:center;cursor:pointer;"
                          onclick={() => cart.setQuantity(item.id, getCartItemQuantity(item.id) + 1)}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    {:else}
                      <button
                        type="button"
                        style="width:32px;height:32px;border-radius:50%;border:1px solid rgba(99,102,241,0.2);background:rgba(255,255,255,0.7);color:#4338ca;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:20;"
                        onclick={() => cart.addItem(item, 1)}
                      >
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

<!-- FABs -->
<div style="position:fixed;bottom:24px;right:16px;display:flex;flex-direction:column;gap:12px;z-index:40;">
  <button
    type="button"
    class="sg-glass"
    style="width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;color:{waiterCalled
      ? '#6366f1'
      : '#4338ca'};border:1px solid rgba(99,102,241,0.2);box-shadow:0 4px 20px rgba(99,102,241,0.15);{waiterCooldown && !waiterCalled
      ? 'opacity:0.5;'
      : ''}"
    onclick={handleCallWaiter}
    title="Call Waiter"
  >
    <Bell size={20} />
  </button>

  {#if $cartCount > 0 && !isCartOpen}
    <div transition:fly={{ y: 20, duration: 300 }}>
      <button
        type="button"
        style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);box-shadow:0 6px 24px rgba(99,102,241,0.4);display:flex;align-items:center;justify-content:center;color:white;border:none;cursor:pointer;position:relative;"
        onclick={() => (isCartOpen = true)}
      >
        <ShoppingCart size={22} />
        <span
          style="position:absolute;top:-4px;right:-4px;background:white;color:#6366f1;font-size:11px;font-weight:800;width:22px;height:22px;display:flex;align-items:center;justify-content:center;border-radius:50%;box-shadow:0 2px 8px rgba(99,102,241,0.3);border:2px solid #6366f1;"
        >
          {$cartCount}
        </span>
      </button>
    </div>
  {/if}
</div>

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
      style="width:100%;max-height:85vh;border-radius:24px 24px 0 0;position:relative;display:flex;flex-direction:column;overflow:hidden;border:1px solid rgba(255,255,255,0.8);box-shadow:0 -8px 40px rgba(99,102,241,0.15);"
      transition:fly={{ y: 100, duration: 300, opacity: 1 }}
    >
      <button type="button" aria-label="Close cart" style="width:100%;display:flex;justify-content:center;padding:14px;background:none;border:none;cursor:pointer;" onclick={() => (isCartOpen = false)}>
        <div style="width:40px;height:4px;background:rgba(99,102,241,0.25);border-radius:99px;"></div>
      </button>

      <div style="padding:0 24px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(99,102,241,0.1);">
        <h2 style="font-size:22px;font-weight:900;color:#1e1b4b;margin:0;letter-spacing:-0.03em;display:flex;align-items:center;gap:10px;">
          Your Order
          <span class="sg-badge-info">{$cartCount}</span>
        </h2>
        <button
          type="button"
          style="width:32px;height:32px;border-radius:50%;border:none;background:rgba(99,102,241,0.08);color:#6b6a9c;display:flex;align-items:center;justify-content:center;cursor:pointer;"
          onclick={() => (isCartOpen = false)}
        >
          <X size={16} />
        </button>
      </div>

      <div style="flex:1;overflow-y:auto;padding:20px 24px;display:flex;flex-direction:column;gap:20px;">
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
                style="display:flex;align-items:center;gap:6px;background:rgba(99,102,241,0.08);border-radius:99px;padding:3px;border:1px solid rgba(99,102,241,0.15);"
              >
                <button
                  type="button"
                  style="width:26px;height:26px;border-radius:50%;border:none;background:white;color:#4338ca;display:flex;align-items:center;justify-content:center;cursor:pointer;"
                  onclick={() => cart.setQuantity(item.menu_item.id, item.quantity - 1)}
                >
                  <Minus size={12} />
                </button>
                <span style="width:14px;text-align:center;font-weight:700;font-size:12px;">{item.quantity}</span>
                <button
                  type="button"
                  style="width:26px;height:26px;border-radius:50%;border:none;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;display:flex;align-items:center;justify-content:center;cursor:pointer;"
                  onclick={() => cart.setQuantity(item.menu_item.id, item.quantity + 1)}
                >
                  <Plus size={12} />
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

      <div style="padding:20px 24px;border-top:1px solid rgba(99,102,241,0.1);background:rgba(255,255,255,0.4);display:flex;flex-direction:column;gap:10px;">
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
          <span style="color:#6366f1;">{formatCurrency($cartTotal * 1.1)}</span>
        </div>
        <button type="button" class="sg-btn-primary" style="width:100%;padding:14px;margin-top:6px;font-size:15px;" onclick={placeOrder}>
          Place Order
        </button>
        <button type="button" class="sg-btn-ghost" style="width:100%;" onclick={handleCallWaiter}>
          <Bell size={15} /> Need assistance? Call Waiter
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Checkout modal -->
{#if showCheckoutModal}
  <div
    style="position:fixed;inset:0;z-index:50;display:flex;align-items:flex-end;justify-content:center;padding:16px;sm:align-items:center;"
    transition:fade={{ duration: 200 }}
  >
    <button
      type="button"
      aria-label="Close checkout"
      style="position:absolute;inset:0;background:rgba(30,27,75,0.5);backdrop-filter:blur(8px);border:none;cursor:pointer;"
      onclick={() => !isProcessingPayment && (showCheckoutModal = false)}
    ></button>

    <div class="sg-tile sg-tile-static" style="width:100%;max-width:400px;padding:28px;position:relative;z-index:10;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3 style="font-size:20px;font-weight:900;color:#1e1b4b;margin:0;letter-spacing:-0.03em;">Payment</h3>
        <button
          type="button"
          style="background:none;border:none;color:#8b84c0;cursor:pointer;display:flex;"
          onclick={() => (showCheckoutModal = false)}
          disabled={isProcessingPayment}
        >
          <X size={20} />
        </button>
      </div>

      <div style="text-align:center;padding:16px 0;border-bottom:1px solid rgba(99,102,241,0.1);margin-bottom:20px;">
        <p style="font-size:12px;font-family:'Geist Mono',monospace;color:#8b84c0;text-transform:uppercase;letter-spacing:0.06em;margin:0;">
          Amount to pay
        </p>
        <p style="font-size:32px;font-weight:900;color:#6366f1;margin:6px 0 0;letter-spacing:-0.04em;">
          {formatCurrency($cartTotal * 1.1)}
        </p>
      </div>

      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:20px;">
        {#each [{ id: 'upi', label: 'UPI', Icon: Smartphone }, { id: 'card', label: 'Card', Icon: CreditCard }, { id: 'cash', label: 'Cash', Icon: Banknote }] as method}
          <button
            type="button"
            style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 8px;border-radius:14px;border:1px solid {paymentMethod ===
            method.id
              ? 'rgba(99,102,241,0.4)'
              : 'rgba(99,102,241,0.12)'};background:{paymentMethod === method.id
              ? 'rgba(99,102,241,0.1)'
              : 'rgba(255,255,255,0.5)'};color:{paymentMethod === method.id ? '#4338ca' : '#8b84c0'};cursor:pointer;font-family:'Cabinet Grotesk',system-ui,sans-serif;"
            onclick={() => (paymentMethod = method.id as 'upi' | 'card' | 'cash')}
          >
            <method.Icon size={18} />
            <span style="font-size:11px;font-weight:700;">{method.label}</span>
          </button>
        {/each}
      </div>

      <div style="min-height:100px;display:flex;flex-direction:column;justify-content:center;margin-bottom:16px;">
        {#if paymentMethod === 'upi'}
          <label class="sg-label" for="upi-input">UPI ID</label>
          <input id="upi-input" type="text" class="sg-input" value="goldenfork@upi" />
        {:else if paymentMethod === 'card'}
          <div style="display:flex;flex-direction:column;gap:10px;">
            <input type="text" class="sg-input" placeholder="Card Number" value="**** **** **** 4242" />
            <div style="display:flex;gap:10px;">
              <input type="text" class="sg-input" placeholder="MM/YY" value="12/26" />
              <input type="text" class="sg-input" placeholder="CVV" value="***" />
            </div>
          </div>
        {:else}
          <p style="text-align:center;font-size:13px;color:#8b84c0;margin:0;">
            A waiter will collect cash at your table.
          </p>
        {/if}
      </div>

      <button
        type="button"
        class="sg-btn-primary"
        style="width:100%;padding:14px;font-size:15px;height:52px;"
        onclick={handlePayment}
        disabled={isProcessingPayment}
      >
        {#if isProcessingPayment}
          <div style="width:22px;height:22px;border:2px solid rgba(255,255,255,0.3);border-top-color:white;border-radius:50%;animation:spin 0.7s linear infinite;"></div>
        {:else}
          {paymentMethod === 'cash' ? 'Place Order (Cash)' : 'Confirm Payment'}
        {/if}
      </button>
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
