<script lang="ts">
  import { adminOrders, ordersByStatus, waiterRequests, pendingWaiterCount } from '$lib/stores/admin';
  import { timeAgo } from '$lib/utils';
  import { MOCK_TABLES } from '$lib/mock-data';
  import { toast } from 'svelte-sonner';
  import { AlertTriangle, Clock, ChefHat, Check, ArrowRight } from '@lucide/svelte';

  const columns = [
    { id: 'pending', title: 'New Orders', accent: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    { id: 'preparing', title: 'Preparing', accent: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
    { id: 'ready', title: 'Ready', accent: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
    { id: 'served', title: 'Served', accent: '#94a3b8', bg: 'rgba(148,163,184,0.12)' }
  ] as const;

  function moveOrder(orderId: string, currentStatus: string) {
    let nextStatus: 'preparing' | 'ready' | 'served' = 'preparing';
    if (currentStatus === 'pending') nextStatus = 'preparing';
    else if (currentStatus === 'preparing') nextStatus = 'ready';
    else if (currentStatus === 'ready') nextStatus = 'served';

    adminOrders.updateStatus(orderId, nextStatus);
    toast.success(`Order moved to ${nextStatus}`);
  }

  let currentTime = $state(Date.now());
  $effect(() => {
    const interval = setInterval(() => {
      currentTime = Date.now();
    }, 30000);
    return () => clearInterval(interval);
  });

  function getTableName(id: string) {
    return MOCK_TABLES.find((t) => t.id === id)?.display_name || id;
  }

  function actionStyle(status: string) {
    if (status === 'pending') return { bg: 'linear-gradient(135deg,#f59e0b,#f97316)', label: 'Start Preparing', Icon: ChefHat };
    if (status === 'preparing') return { bg: 'linear-gradient(135deg,#8b5cf6,#6366f1)', label: 'Mark as Ready', Icon: Check };
    return { bg: 'linear-gradient(135deg,#22c55e,#16a34a)', label: 'Serve Order', Icon: ArrowRight };
  }
</script>

<svelte:head>
  <title>Kitchen Display · Owner Portal</title>
</svelte:head>

<div style="display:flex;flex-direction:column;gap:16px;min-height:calc(100dvh - 120px);">
  {#if $pendingWaiterCount > 0}
    <button
      type="button"
      class="sg-tile"
      style="padding:14px 18px;display:flex;align-items:center;justify-content:space-between;border-color:rgba(239,68,68,0.25);background:rgba(239,68,68,0.06);cursor:pointer;width:100%;text-align:left;font-family:inherit;"
      onclick={() => {
        const pending = $waiterRequests.find((r) => r.status === 'pending');
        if (pending) waiterRequests.acknowledge(pending.id);
      }}
    >
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="width:36px;height:36px;border-radius:10px;background:rgba(239,68,68,0.12);display:flex;align-items:center;justify-content:center;color:#dc2626;">
          <AlertTriangle size={18} />
        </div>
        <div>
          <div style="font-size:14px;font-weight:700;color:#dc2626;">
            {$pendingWaiterCount} waiter request{$pendingWaiterCount === 1 ? '' : 's'} pending
          </div>
          <div style="font-size:11px;font-family:'Geist Mono',monospace;color:#8b84c0;margin-top:2px;">
            Tap to acknowledge
          </div>
        </div>
      </div>
    </button>
  {/if}

  <div class="sg-page-header" style="margin-bottom:8px;">
    <div>
      <h1 class="sg-page-title">Kitchen Display</h1>
      <p class="sg-page-subtitle">Real-time order pipeline</p>
    </div>
  </div>

  <div style="display:flex;gap:14px;flex:1;min-height:0;overflow-x:auto;padding-bottom:8px;" class="sg-hide-scrollbar">
    {#each columns as col}
      {@const colOrders = $ordersByStatus[col.id] || []}
      <div class="sg-tile sg-tile-static" style="width:300px;min-width:280px;flex-shrink:0;display:flex;flex-direction:column;overflow:hidden;max-height:calc(100dvh - 200px);">
        <div
          style="padding:14px 16px;border-bottom:1px solid rgba(99,102,241,0.08);display:flex;align-items:center;justify-content:space-between;background:{col.bg};"
        >
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="width:8px;height:8px;border-radius:50%;background:{col.accent};box-shadow:0 0 8px {col.accent};"></div>
            <h2 style="font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;color:#1e1b4b;margin:0;font-family:'Geist Mono',monospace;">
              {col.title}
            </h2>
          </div>
          <span class="sg-badge-info">{colOrders.length}</span>
        </div>

        <div style="flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:10px;">
          {#each colOrders.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) as order (order.id)}
            {@const action = actionStyle(order.status)}
            <div
              style="background:rgba(255,255,255,0.75);border:1px solid rgba(99,102,241,0.12);border-radius:16px;padding:14px;border-left:3px solid {col.accent};"
            >
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid rgba(99,102,241,0.08);">
                <div>
                  <div style="font-size:22px;font-weight:900;color:#1e1b4b;letter-spacing:-0.03em;line-height:1;">
                    {getTableName(order.table_id)}
                  </div>
                  <div style="font-size:10px;font-family:'Geist Mono',monospace;color:#8b84c0;margin-top:4px;">
                    #{order.id.slice(-6).toUpperCase()}
                  </div>
                </div>
                <div
                  style="display:flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:{order.status === 'pending' &&
                  Date.now() - new Date(order.created_at).getTime() > 600000
                    ? '#dc2626'
                    : '#8b84c0'};"
                >
                  <Clock size={13} />
                  {#key currentTime}
                    {timeAgo(order.created_at)}
                  {/key}
                </div>
              </div>

              <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px;">
                {#each order.order_items ?? [] as item}
                  <div style="display:flex;gap:8px;align-items:flex-start;">
                    <span
                      style="font-size:12px;font-weight:800;color:#6366f1;background:rgba(99,102,241,0.1);padding:2px 7px;border-radius:6px;flex-shrink:0;"
                    >
                      {item.quantity}×
                    </span>
                    <div>
                      <span style="font-size:13px;font-weight:600;color:#1e1b4b;">
                        {item.menu_item?.name ?? item.menu_item_id}
                      </span>
                      {#if item.special_instructions}
                        <p
                          style="font-size:11px;color:#d97706;background:rgba(245,158,11,0.1);padding:4px 8px;border-radius:8px;margin:4px 0 0;border:1px solid rgba(245,158,11,0.2);font-style:italic;"
                        >
                          Note: {item.special_instructions}
                        </p>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>

              {#if order.status !== 'served'}
                <button
                  type="button"
                  style="width:100%;padding:10px;border-radius:12px;border:none;background:{action.bg};color:white;font-weight:700;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;font-family:'Cabinet Grotesk',system-ui,sans-serif;box-shadow:0 4px 12px rgba(99,102,241,0.2);transition:opacity 0.15s;"
                  onclick={() => moveOrder(order.id, order.status)}
                >
                  <action.Icon size={16} />
                  {action.label}
                </button>
              {/if}
            </div>
          {/each}

          {#if colOrders.length === 0}
            <div
              style="height:120px;display:flex;align-items:center;justify-content:center;color:#8b84c0;font-size:13px;border:1.5px dashed rgba(99,102,241,0.2);border-radius:14px;font-family:'Geist Mono',monospace;"
            >
              No orders
            </div>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>
