<script lang="ts">
  import { fly } from 'svelte/transition';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { toast } from 'svelte-sonner';
  import {
    Bell,
    CheckCircle,
    ArrowLeft,
    Clock,
    ChefHat,
    Utensils,
    ThumbsUp,
    X,
    CheckCircle2,
    UtensilsCrossed
  } from '@lucide/svelte';

  import { session } from '$lib/stores/session';
  import { adminOrders, waiterRequests } from '$lib/stores/admin';
  import { formatCurrency, generateUUID } from '$lib/utils';

  import StatusBadge from '$lib/components/StatusBadge.svelte';

  let orderId = $derived($session.activeOrderId);
  let order = $derived($adminOrders.find((o) => o.id === orderId));

  let waiterCalled = $state(false);
  let waiterCooldown = $state(false);
  let showWaiterBanner = $state(false);
  let cooldownSeconds = $state(0);
  let simulationInterval: ReturnType<typeof setInterval>;

  $effect(() => {
    if (!orderId) {
      goto(`/table/${page.params.restaurant_id}/${page.params.table_id}`);
      return;
    }

    simulationInterval = setInterval(() => {
      const currentOrder = $adminOrders.find((o) => o.id === orderId);
      if (!currentOrder) return;

      if (currentOrder.status === 'pending') {
        adminOrders.updateStatus(orderId!, 'preparing');
        toast.info('Chefs have started preparing your order');
      } else if (currentOrder.status === 'preparing') {
        adminOrders.updateStatus(orderId!, 'ready');
        toast.success('Your food is ready and on the way');
      } else if (currentOrder.status === 'ready') {
        adminOrders.updateStatus(orderId!, 'served');
        toast.success('Your order has been served. Enjoy!');
        clearInterval(simulationInterval);
      }
    }, 15000);

    return () => {
      if (simulationInterval) clearInterval(simulationInterval);
    };
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

  function handleCallWaiter() {
    if (waiterCooldown) {
      showWaiterBanner = true;
      return;
    }
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
      waiterCooldown = true;
      cooldownSeconds = 120;
      showWaiterBanner = true;
      toast.success('Waiter notified');
      setTimeout(() => (waiterCalled = false), 3000);
    }
  }

  function handleBack() {
    if (order && !['served', 'paid', 'cancelled'].includes(order.status)) {
      if (!confirm('Your order is still active. Return to menu?')) return;
    }
    goto(`/table/${page.params.restaurant_id}/${page.params.table_id}`);
  }

  function finishAndClear() {
    session.clearOrder();
    goto(`/table/${page.params.restaurant_id}/${page.params.table_id}`);
  }

  function formatCooldown(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  const STAGES = [
    { id: 'pending', label: 'Placed', icon: Clock, msg: 'Order received — sit back and relax.' },
    { id: 'preparing', label: 'Preparing', icon: ChefHat, msg: 'Our chefs are working on your order.' },
    { id: 'ready', label: 'Ready', icon: Utensils, msg: 'Your food is ready — a waiter will bring it.' },
    { id: 'served', label: 'Served', icon: ThumbsUp, msg: 'Enjoy your meal!' }
  ];

  let currentStageIndex = $derived(!order ? 0 : Math.max(0, STAGES.findIndex((s) => s.id === order.status)));
  let isComplete = $derived(order ? ['served', 'paid'].includes(order.status) : false);
</script>

<svelte:head>
  <title>Track Order</title>
</svelte:head>

{#if order}
  <header class="sg-glass track-header">
    <button
      type="button"
      class="sg-touch track-back"
      onclick={handleBack}
      aria-label="Back to menu"
    >
      <ArrowLeft size={18} />
    </button>
    <div class="track-header__copy">
      <h1>Order Tracking</h1>
      <p class="sg-num">#{order.id.slice(0, 8).toUpperCase()}</p>
    </div>
    <span class="sg-badge-info">{order.table_id}</span>
  </header>

  <main class="track-main">
    <section class="sg-tile sg-tile-static sg-stagger track-hero" style="--i:0;">
      <div class="track-hero__status">
        <StatusBadge status={order.status} />
        <h2 class="sg-title-balance">{STAGES[currentStageIndex]?.msg || 'Order updated'}</h2>
      </div>

      <div class="track-stages">
        <div class="track-stages__rail" aria-hidden="true">
          <div
            class="track-stages__fill"
            style="width:{(Math.min(currentStageIndex, 3) / 3) * 100}%;"
          ></div>
        </div>

        <div class="track-stages__row">
          {#each STAGES.slice(0, 4) as stage, i}
            {@const isCompleted = i <= currentStageIndex}
            {@const isCurrent = i === currentStageIndex}
            <div class="track-stage">
              <div
                class="track-stage__icon"
                class:is-done={isCompleted}
                class:is-current={isCurrent}
              >
                {#if isCurrent}
                  <span class="track-stage__ring"></span>
                {/if}
                <stage.icon size={16} />
              </div>
              <span class="track-stage__label" class:is-done={isCompleted}>{stage.label}</span>
            </div>
          {/each}
        </div>
      </div>
    </section>

    <section class="sg-stagger" style="--i:1;">
      <h3 class="track-summary-label">Order Summary</h3>
      <div class="sg-tile sg-tile-static track-summary">
        {#each order.order_items ?? [] as item}
          <div class="track-line">
            <div class="sg-media track-line__thumb">
              <img src={item.menu_item?.image_url} alt={item.menu_item?.name} />
            </div>
            <div class="track-line__info">
              <h4 class="sg-title-balance">{item.menu_item?.name ?? item.menu_item_id}</h4>
              <p class="sg-num">Qty: {item.quantity}</p>
            </div>
            <div class="track-line__price sg-num">
              {formatCurrency((item.menu_item?.price ?? 0) * item.quantity)}
            </div>
          </div>
        {/each}

        {#if order.special_notes}
          <div class="track-notes">
            <p class="sg-text-pretty">
              <span>Notes:</span>
              {order.special_notes}
            </p>
          </div>
        {/if}

        <div class="track-totals">
          <div class="track-totals__row">
            <span>Subtotal</span>
            <span class="sg-num">{formatCurrency(order.total_amount)}</span>
          </div>
          <div class="track-totals__total">
            <span>Total</span>
            <span class="sg-num">{formatCurrency(order.total_amount)}</span>
          </div>
        </div>
      </div>
    </section>
  </main>

  {#if showWaiterBanner}
    <div
      class="sg-waiter-banner track-waiter"
      transition:fly={{ y: 24, duration: 280 }}
      role="status"
    >
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

  <div class="sg-thumb-bar track-bar">
    <button
      type="button"
      class="sg-btn-ghost thumb-waiter"
      style="color:{waiterCalled ? 'var(--sg-accent)' : 'var(--sg-accent-strong)'};"
      onclick={handleCallWaiter}
      aria-label="Call waiter"
    >
      <Bell size={20} />
    </button>
    {#if isComplete}
      <button type="button" class="sg-btn-primary thumb-cta" onclick={finishAndClear}>
        <UtensilsCrossed size={18} /> Back to menu
      </button>
    {:else}
      <button type="button" class="track-confirmed" disabled>
        <CheckCircle size={18} /> Order Confirmed
      </button>
    {/if}
  </div>
{:else}
  <div class="track-loading">
    <div class="spin"></div>
    <p>Loading your order…</p>
  </div>
{/if}

<style>
  .track-header {
    position: fixed;
    top: 0;
    inset-inline: 0;
    z-index: 40;
    border-bottom: 1px solid var(--sg-line);
    padding: 10px 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .track-back {
    width: 48px;
    height: 48px;
    border-radius: var(--sg-radius-sm);
    border: 1px solid var(--sg-line);
    background: rgba(255, 252, 247, 0.7);
    color: var(--sg-accent-strong);
  }

  .track-header__copy {
    flex: 1;
    min-width: 0;
  }

  .track-header__copy h1 {
    font-size: 16px;
    font-weight: 800;
    color: var(--sg-ink);
    margin: 0;
    letter-spacing: -0.02em;
  }

  .track-header__copy p {
    font-size: 11px;
    font-family: var(--sg-font-mono);
    color: var(--sg-muted);
    margin: 2px 0 0;
  }

  .track-main {
    padding: 84px 16px calc(120px + env(safe-area-inset-bottom, 0px));
    max-width: 480px;
    margin: 0 auto;
  }

  .track-hero {
    padding: 22px 20px;
    margin-bottom: 20px;
  }

  .track-hero__status {
    text-align: center;
    margin-bottom: 22px;
  }

  .track-hero__status h2 {
    font-size: 16px;
    font-weight: 700;
    color: var(--sg-ink);
    margin: 12px 0 0;
    letter-spacing: -0.02em;
    line-height: 1.35;
  }

  .track-stages {
    position: relative;
    padding-top: 4px;
  }

  .track-stages__rail {
    position: absolute;
    top: 22px;
    left: 28px;
    right: 28px;
    height: 2px;
    background: var(--sg-line);
    border-radius: 99px;
    overflow: hidden;
    z-index: 0;
  }

  .track-stages__fill {
    height: 100%;
    background: linear-gradient(90deg, var(--sg-accent), var(--sg-accent-strong));
    transition: width 0.8s var(--sg-ease);
  }

  .track-stages__row {
    position: relative;
    z-index: 1;
    display: flex;
    justify-content: space-between;
  }

  .track-stage {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .track-stage__icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    background: rgba(255, 252, 247, 0.8);
    color: var(--sg-faint);
    border: 1px solid var(--sg-line);
    transition: background 0.35s ease, color 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease,
      transform 0.35s ease;
  }

  .track-stage__icon.is-done {
    background: linear-gradient(135deg, var(--sg-accent), var(--sg-accent-strong));
    color: #fffaf5;
    border-color: transparent;
    box-shadow: var(--sg-shadow-accent);
  }

  .track-stage__icon.is-current {
    transform: scale(1.06);
  }

  .track-stage__ring {
    position: absolute;
    inset: -3px;
    border-radius: 50%;
    border: 2px solid var(--sg-accent-border);
    animation: sg-ring 1.5s ease-out infinite;
  }

  .track-stage__label {
    font-size: 10px;
    font-weight: 600;
    font-family: var(--sg-font-mono);
    text-align: center;
    width: 56px;
    color: var(--sg-muted);
  }

  .track-stage__label.is-done {
    color: var(--sg-ink);
  }

  .track-summary-label {
    font-size: 12px;
    font-family: var(--sg-font-mono);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--sg-muted);
    margin: 0 0 12px;
  }

  .track-summary {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .track-line {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .track-line__thumb {
    width: 52px;
    height: 52px;
    border-radius: calc(var(--sg-radius-lg) - 12px);
    flex-shrink: 0;
  }

  .track-line__info {
    flex: 1;
    min-width: 0;
  }

  .track-line__info h4 {
    font-size: 13px;
    font-weight: 700;
    color: var(--sg-ink);
    margin: 0;
  }

  .track-line__info p {
    font-size: 11px;
    color: var(--sg-muted);
    margin: 2px 0 0;
  }

  .track-line__price {
    font-size: 13px;
    font-weight: 800;
    color: var(--sg-accent);
  }

  .track-notes {
    padding: 12px;
    background: var(--sg-accent-soft);
    border-radius: var(--sg-radius-sm);
    border: 1px solid var(--sg-line);
  }

  .track-notes p {
    font-size: 12px;
    color: var(--sg-muted);
    margin: 0;
  }

  .track-notes span {
    font-weight: 700;
    color: var(--sg-ink);
  }

  .track-totals {
    padding-top: 12px;
    border-top: 1px solid var(--sg-line);
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .track-totals__row {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    color: var(--sg-muted);
  }

  .track-totals__total {
    display: flex;
    justify-content: space-between;
    font-size: 16px;
    font-weight: 800;
    color: var(--sg-ink);
    padding-top: 4px;
  }

  .track-totals__total .sg-num {
    color: var(--sg-accent);
  }

  .track-waiter {
    bottom: calc(96px + env(safe-area-inset-bottom, 0px));
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

  .track-bar {
    max-width: 480px;
    margin: 0 auto;
    left: 0;
    right: 0;
  }

  .thumb-waiter {
    min-width: 56px;
    min-height: 52px;
    padding: 12px;
  }

  .thumb-cta {
    flex: 1;
    min-height: 52px;
    padding: 14px;
    font-size: 14px;
  }

  .track-confirmed {
    flex: 1;
    min-height: 52px;
    padding: 14px;
    border-radius: var(--sg-radius-sm);
    border: 1px solid var(--sg-line);
    background: var(--sg-accent-soft);
    color: var(--sg-accent-strong);
    font-weight: 700;
    font-size: 14px;
    font-family: var(--sg-font);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: default;
    opacity: 0.9;
  }

  .track-loading {
    min-height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 14px;
  }

  .track-loading p {
    font-size: 13px;
    color: var(--sg-muted);
    font-family: var(--sg-font-mono);
  }

  .spin {
    width: 32px;
    height: 32px;
    border: 3px solid var(--sg-line);
    border-top-color: var(--sg-accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes sg-ring {
    0% {
      transform: scale(1);
      opacity: 0.8;
    }
    100% {
      transform: scale(1.35);
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .spin,
    .track-stage__ring,
    .track-stages__fill {
      animation: none !important;
      transition: none !important;
    }
  }
</style>
