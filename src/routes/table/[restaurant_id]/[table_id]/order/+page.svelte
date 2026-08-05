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
  <title>Track Order · Demo Template</title>
</svelte:head>

{#if order}
  <header
    class="sg-glass"
    style="position:fixed;top:0;inset-inline:0;z-index:40;border-bottom:1px solid rgba(99,102,241,0.1);padding:10px 12px;display:flex;align-items:center;gap:8px;"
  >
    <button
      type="button"
      class="sg-touch"
      style="width:48px;height:48px;border-radius:12px;border:1px solid rgba(99,102,241,0.15);background:rgba(255,255,255,0.6);color:#4338ca;"
      onclick={handleBack}
      aria-label="Back to menu"
    >
      <ArrowLeft size={18} />
    </button>
    <div style="flex:1;min-width:0;">
      <h1 style="font-size:16px;font-weight:800;color:#1e1b4b;margin:0;letter-spacing:-0.02em;">Order Tracking</h1>
      <p style="font-size:11px;font-family:'Geist Mono',monospace;color:#8b84c0;margin:2px 0 0;">
        #{order.id.slice(0, 8).toUpperCase()}
      </p>
    </div>
    <span class="sg-badge-info">{order.table_id}</span>
  </header>

  <main style="padding:84px 16px calc(120px + env(safe-area-inset-bottom, 0px));max-width:480px;margin:0 auto;">
    <section class="sg-tile sg-tile-static sg-stagger" style="padding:28px 24px;margin-bottom:20px;--i:0;">
      <div style="text-align:center;margin-bottom:28px;">
        <StatusBadge status={order.status} />
        <h2 style="font-size:18px;font-weight:800;color:#1e1b4b;margin:14px 0 0;letter-spacing:-0.02em;line-height:1.3;">
          {STAGES[currentStageIndex]?.msg || 'Order updated'}
        </h2>
      </div>

      <div style="position:relative;padding-top:4px;">
        <div
          style="position:absolute;top:22px;left:28px;right:28px;height:3px;background:rgba(99,102,241,0.12);border-radius:99px;overflow:hidden;z-index:0;"
        >
          <div
            style="height:100%;background:linear-gradient(90deg,#6366f1,#8b5cf6);transition:width 1s ease;width:{(Math.min(currentStageIndex, 3) / 3) * 100}%;"
          ></div>
        </div>

        <div style="position:relative;z-index:1;display:flex;justify-content:space-between;">
          {#each STAGES.slice(0, 4) as stage, i}
            {@const isCompleted = i <= currentStageIndex}
            {@const isCurrent = i === currentStageIndex}
            <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
              <div
                style="width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:all 0.4s ease-out;position:relative;{isCompleted
                  ? 'background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;box-shadow:0 4px 14px rgba(99,102,241,0.35);'
                  : 'background:rgba(255,255,255,0.7);color:#a5b4fc;border:1px solid rgba(99,102,241,0.15);'}{isCurrent
                  ? 'transform:scale(1.08);'
                  : ''}"
              >
                {#if isCurrent}
                  <span
                    style="position:absolute;inset:-3px;border-radius:50%;border:2px solid rgba(99,102,241,0.4);animation:sg-ring 1.5s ease-out infinite;"
                  ></span>
                {/if}
                <stage.icon size={16} />
              </div>
              <span
                style="font-size:10px;font-weight:600;font-family:'Geist Mono',monospace;text-align:center;width:56px;color:{isCompleted
                  ? '#1e1b4b'
                  : '#8b84c0'};"
              >
                {stage.label}
              </span>
            </div>
          {/each}
        </div>
      </div>
    </section>

    <section class="sg-stagger" style="--i:1;">
      <h3
        style="font-size:13px;font-family:'Geist Mono',monospace;text-transform:uppercase;letter-spacing:0.08em;color:#8b84c0;margin:0 0 12px;"
      >
        Order Summary
      </h3>
      <div class="sg-tile sg-tile-static" style="padding:18px;display:flex;flex-direction:column;gap:14px;">
        {#each order.order_items ?? [] as item}
          <div style="display:flex;gap:12px;align-items:center;">
            <div style="width:52px;height:52px;border-radius:12px;overflow:hidden;background:rgba(99,102,241,0.08);flex-shrink:0;">
              <img src={item.menu_item?.image_url} alt={item.menu_item?.name} style="width:100%;height:100%;object-fit:cover;" />
            </div>
            <div style="flex:1;min-width:0;">
              <h4 style="font-size:13px;font-weight:700;color:#1e1b4b;margin:0;">{item.menu_item?.name ?? item.menu_item_id}</h4>
              <p style="font-size:11px;color:#8b84c0;margin:2px 0 0;">Qty: {item.quantity}</p>
            </div>
            <div style="font-size:13px;font-weight:800;color:#6366f1;">
              {formatCurrency((item.menu_item?.price ?? 0) * item.quantity)}
            </div>
          </div>
        {/each}

        {#if order.special_notes}
          <div style="padding:12px;background:rgba(99,102,241,0.05);border-radius:12px;border:1px solid rgba(99,102,241,0.1);">
            <p style="font-size:12px;color:#8b84c0;margin:0;">
              <span style="font-weight:700;color:#1e1b4b;">Notes:</span>
              {order.special_notes}
            </p>
          </div>
        {/if}

        <div style="padding-top:12px;border-top:1px solid rgba(99,102,241,0.1);display:flex;flex-direction:column;gap:6px;">
          <div style="display:flex;justify-content:space-between;font-size:13px;color:#8b84c0;">
            <span>Subtotal</span>
            <span>{formatCurrency(order.total_amount)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:800;color:#1e1b4b;padding-top:4px;">
            <span>Total</span>
            <span style="color:#6366f1;">{formatCurrency(order.total_amount)}</span>
          </div>
        </div>
      </div>
    </section>
  </main>

  {#if showWaiterBanner}
    <div
      class="sg-waiter-banner"
      style="bottom:calc(96px + env(safe-area-inset-bottom, 0px));"
      transition:fly={{ y: 24, duration: 280 }}
      role="status"
    >
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

  <div
    class="sg-thumb-bar"
    style="max-width:480px;margin:0 auto;left:0;right:0;"
  >
    <button
      type="button"
      class="sg-btn-ghost"
      style="min-width:56px;min-height:52px;padding:12px;color:{waiterCalled ? '#6366f1' : '#4338ca'};"
      onclick={handleCallWaiter}
      aria-label="Call waiter"
    >
      <Bell size={20} />
    </button>
    {#if isComplete}
      <button
        type="button"
        class="sg-btn-primary"
        style="flex:1;min-height:52px;padding:14px;font-size:14px;"
        onclick={finishAndClear}
      >
        <UtensilsCrossed size={18} /> Back to menu
      </button>
    {:else}
      <button
        type="button"
        style="flex:1;min-height:52px;padding:14px;border-radius:12px;border:1px solid rgba(99,102,241,0.15);background:rgba(99,102,241,0.08);color:#4338ca;font-weight:700;font-size:14px;font-family:'Cabinet Grotesk',system-ui,sans-serif;display:flex;align-items:center;justify-content:center;gap:8px;cursor:default;opacity:0.9;"
        disabled
      >
        <CheckCircle size={18} /> Order Confirmed
      </button>
    {/if}
  </div>
{:else}
  <div style="min-height:100dvh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:14px;">
    <div
      style="width:32px;height:32px;border:3px solid rgba(99,102,241,0.2);border-top-color:#6366f1;border-radius:50%;animation:spin 0.8s linear infinite;"
    ></div>
    <p style="font-size:13px;color:#8b84c0;font-family:'Geist Mono',monospace;">Loading your order…</p>
  </div>
{/if}

<style>
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
</style>
