<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { toast } from 'svelte-sonner';
  import { Bell, CheckCircle, ArrowLeft, Clock, ChefHat, Utensils, ThumbsUp } from '@lucide/svelte';

  import { session } from '$lib/stores/session';
  import { adminOrders, waiterRequests } from '$lib/stores/admin';
  import { formatCurrency, generateUUID } from '$lib/utils';

  import StatusBadge from '$lib/components/StatusBadge.svelte';

  let orderId = $derived($session.activeOrderId);
  let order = $derived($adminOrders.find((o) => o.id === orderId));

  let waiterCalled = $state(false);
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
      setTimeout(() => (waiterCalled = false), 60000);
    }
  }

  function handleBack() {
    if (order && !['served', 'paid', 'cancelled'].includes(order.status)) {
      if (!confirm('Your order is still active. Return to menu?')) return;
    }
    goto(`/table/${page.params.restaurant_id}/${page.params.table_id}`);
  }

  const STAGES = [
    { id: 'pending', label: 'Placed', icon: Clock, msg: 'Order received — sit back and relax.' },
    { id: 'preparing', label: 'Preparing', icon: ChefHat, msg: 'Our chefs are working on your order.' },
    { id: 'ready', label: 'Ready', icon: Utensils, msg: 'Your food is ready — a waiter will bring it.' },
    { id: 'served', label: 'Served', icon: ThumbsUp, msg: 'Enjoy your meal!' }
  ];

  let currentStageIndex = $derived(!order ? 0 : Math.max(0, STAGES.findIndex((s) => s.id === order.status)));
</script>

<svelte:head>
  <title>Track Order · Demo Template</title>
</svelte:head>

{#if order}
  <header
    class="sg-glass"
    style="position:fixed;top:0;inset-inline:0;z-index:40;border-bottom:1px solid rgba(99,102,241,0.1);padding:14px 16px;display:flex;align-items:center;gap:12px;"
  >
    <button
      type="button"
      style="width:40px;height:40px;border-radius:12px;border:1px solid rgba(99,102,241,0.15);background:rgba(255,255,255,0.6);display:flex;align-items:center;justify-content:center;color:#4338ca;cursor:pointer;"
      onclick={handleBack}
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

  <main style="padding:88px 16px 120px;max-width:480px;margin:0 auto;">
    <section class="sg-tile sg-tile-static" style="padding:28px 24px;margin-bottom:20px;">
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
                style="width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:all 0.4s;position:relative;{isCompleted
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

    <section>
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

  <div
    class="sg-glass"
    style="position:fixed;bottom:0;inset-inline:0;border-top:1px solid rgba(99,102,241,0.1);padding:14px 16px;z-index:40;max-width:480px;margin:0 auto;left:0;right:0;"
  >
    <div style="display:flex;gap:10px;">
      <button
        type="button"
        class="sg-btn-ghost"
        style="width:52px;padding:14px;"
        onclick={handleCallWaiter}
        aria-label="Call waiter"
      >
        <span style="display:flex;color:{waiterCalled ? '#6366f1' : 'inherit'};">
          <Bell size={18} />
        </span>
      </button>
      <button
        type="button"
        style="flex:1;padding:14px;border-radius:12px;border:1px solid rgba(99,102,241,0.15);background:rgba(99,102,241,0.08);color:#4338ca;font-weight:700;font-size:14px;font-family:'Cabinet Grotesk',system-ui,sans-serif;display:flex;align-items:center;justify-content:center;gap:8px;cursor:default;opacity:0.85;"
        disabled
      >
        <CheckCircle size={18} /> Order Confirmed
      </button>
    </div>
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
