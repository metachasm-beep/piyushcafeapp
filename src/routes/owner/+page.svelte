<script lang="ts">
  import { adminOrders, waiterRequests, pendingWaiterCount } from '$lib/stores/admin';
  import { MOCK_TABLES } from '$lib/mock-data';
  import { formatCurrency, timeAgo } from '$lib/utils';
  import { ShoppingBag, TrendingUp, Users, BellRing, CheckCircle, Clock } from '@lucide/svelte';

  let todayDate = $derived(
    new Intl.DateTimeFormat('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date())
  );

  let totalOrdersToday = $derived($adminOrders.length);
  let todayRevenue = $derived($adminOrders.reduce((sum, order) => sum + order.total_amount, 0));
  let occupiedTables = $derived(
    MOCK_TABLES.filter((t) =>
      $adminOrders.some((o) => o.table_id === t.id && ['pending', 'preparing', 'ready'].includes(o.status))
    ).length
  );

  function getTableStatus(tableId: string) {
    const activeOrders = $adminOrders.filter(
      (o) => o.table_id === tableId && ['pending', 'preparing', 'ready'].includes(o.status)
    );
    const hasWaiterRequest = $waiterRequests.some((r) => r.table_id === tableId && r.status === 'pending');

    if (hasWaiterRequest)
      return {
        state: 'requested',
        border: 'rgba(239,68,68,0.35)',
        bg: 'rgba(239,68,68,0.06)',
        color: '#dc2626',
        label: 'Waiter Requested'
      };
    if (activeOrders.some((o) => o.status === 'ready'))
      return {
        state: 'ready',
        border: 'rgba(139,92,246,0.35)',
        bg: 'rgba(139,92,246,0.08)',
        color: '#7c3aed',
        label: 'Order Ready'
      };
    if (activeOrders.length > 0)
      return {
        state: 'active',
        border: 'rgba(99,102,241,0.35)',
        bg: 'rgba(99,102,241,0.08)',
        color: '#4f46e5',
        label: 'Occupied'
      };

    return {
      state: 'free',
      border: 'rgba(34,197,94,0.3)',
      bg: 'rgba(34,197,94,0.06)',
      color: '#16a34a',
      label: 'Available'
    };
  }

  function handleAcknowledgeRequest(id: string) {
    waiterRequests.acknowledge(id);
  }

  function handleResolveRequest(id: string) {
    waiterRequests.resolve(id);
  }

  const stats = [
    { label: 'Total Orders', value: () => String(totalOrdersToday), icon: ShoppingBag, color: '#6366f1', bg: 'rgba(99,102,241,0.08)' },
    { label: 'Revenue Today', value: () => formatCurrency(todayRevenue), icon: TrendingUp, color: '#16a34a', bg: 'rgba(34,197,94,0.08)' },
    {
      label: 'Occupied Tables',
      value: () => `${occupiedTables} / ${MOCK_TABLES.length}`,
      icon: Users,
      color: '#8b5cf6',
      bg: 'rgba(139,92,246,0.08)'
    },
    {
      label: 'Pending Requests',
      value: () => String($pendingWaiterCount),
      icon: BellRing,
      color: '#dc2626',
      bg: 'rgba(239,68,68,0.08)'
    }
  ];
</script>

<svelte:head>
  <title>Dashboard · Owner Portal</title>
</svelte:head>

<div>
  <div class="sg-page-header">
    <div>
      <h1 class="sg-page-title">Floor Dashboard</h1>
      <p class="sg-page-subtitle">{todayDate}</p>
    </div>
    <div class="sg-demo-banner">
      <span style="width:6px;height:6px;border-radius:50%;background:#22c55e;box-shadow:0 0 8px rgba(34,197,94,0.7);" class="sg-pulse"></span>
      Live demo session
    </div>
  </div>

  <!-- Stats bento -->
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;margin-bottom:24px;">
    {#each stats as stat}
      <div class="sg-tile" style="padding:22px 24px;position:relative;overflow:hidden;">
        <div style="position:absolute;top:-20px;right:-20px;width:80px;height:80px;border-radius:50%;background:{stat.bg};filter:blur(20px);"></div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
          <span style="font-size:11px;font-family:'Geist Mono',monospace;text-transform:uppercase;letter-spacing:0.07em;color:#8b84c0;">
            {stat.label}
          </span>
          <div
            style="width:32px;height:32px;border-radius:10px;background:{stat.bg};display:flex;align-items:center;justify-content:center;color:{stat.color};"
          >
            <stat.icon size={15} strokeWidth={2} />
          </div>
        </div>
        <div style="font-size:28px;font-weight:900;letter-spacing:-0.04em;color:#1e1b4b;line-height:1;font-variant-numeric:tabular-nums;">
          {stat.value()}
        </div>
      </div>
    {/each}
  </div>

  <div style="display:grid;grid-template-columns:1fr;gap:16px;" class="dash-grid">
    <!-- Floor plan -->
    <div class="sg-tile sg-tile-static" style="padding:24px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <div>
          <div style="font-size:17px;font-weight:800;color:#1e1b4b;letter-spacing:-0.02em;">Floor Plan</div>
          <div style="font-size:11px;font-family:'Geist Mono',monospace;color:#8b84c0;margin-top:2px;text-transform:uppercase;letter-spacing:0.06em;">
            Table status
          </div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;">
        {#each MOCK_TABLES as table}
          {@const status = getTableStatus(table.id)}
          <div
            style="border:1px solid {status.border};background:{status.bg};border-radius:16px;padding:18px 14px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;min-height:110px;transition:transform 0.15s;"
          >
            <span style="font-size:18px;font-weight:800;color:#1e1b4b;letter-spacing:-0.02em;margin-bottom:8px;">
              {table.display_name}
            </span>
            <span
              style="font-size:10px;font-family:'Geist Mono',monospace;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;color:{status.color};padding:4px 10px;border-radius:99px;background:rgba(255,255,255,0.6);border:1px solid {status.border};"
            >
              {status.label}
            </span>
          </div>
        {/each}
      </div>
    </div>

    <!-- Service requests -->
    <div class="sg-tile sg-tile-static" style="padding:24px;display:flex;flex-direction:column;max-height:560px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
        <div>
          <div style="font-size:17px;font-weight:800;color:#1e1b4b;letter-spacing:-0.02em;">Service Requests</div>
          <div style="font-size:11px;font-family:'Geist Mono',monospace;color:#8b84c0;margin-top:2px;text-transform:uppercase;letter-spacing:0.06em;">
            Waiter calls
          </div>
        </div>
        {#if $pendingWaiterCount > 0}
          <span class="sg-badge-warn">{$pendingWaiterCount} New</span>
        {/if}
      </div>

      <div style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:10px;">
        {#if $waiterRequests.filter((r) => r.status !== 'resolved').length === 0}
          <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px;color:#8b84c0;text-align:center;">
            <div style="opacity:0.35;margin-bottom:12px;">
              <CheckCircle size={40} strokeWidth={1.5} />
            </div>
            <p style="font-weight:700;color:#1e1b4b;margin:0 0 4px;">All caught up</p>
            <p style="font-size:13px;margin:0;">No pending service requests.</p>
          </div>
        {:else}
          {#each $waiterRequests
            .filter((r) => r.status !== 'resolved')
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) as request}
            <div
              style="padding:14px 16px;border-radius:14px;background:rgba(99,102,241,0.04);border:1px solid rgba(99,102,241,0.1);border-left:3px solid {request.status ===
              'pending'
                ? '#ef4444'
                : '#f59e0b'};"
            >
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
                <div>
                  <div style="font-size:15px;font-weight:800;color:#1e1b4b;">
                    {MOCK_TABLES.find((t) => t.id === request.table_id)?.display_name || 'Unknown Table'}
                  </div>
                  <div style="display:flex;align-items:center;gap:4px;font-size:11px;color:#8b84c0;margin-top:2px;">
                    <Clock size={11} />
                    {timeAgo(request.created_at)}
                  </div>
                </div>
                <span
                  style="font-size:10px;font-family:'Geist Mono',monospace;text-transform:uppercase;letter-spacing:0.06em;font-weight:700;color:{request.status ===
                  'pending'
                    ? '#dc2626'
                    : '#d97706'};"
                >
                  {request.status}
                </span>
              </div>
              <div style="display:flex;gap:8px;">
                {#if request.status === 'pending'}
                  <button type="button" class="sg-btn-ghost" style="flex:1;padding:8px 12px;font-size:12px;" onclick={() => handleAcknowledgeRequest(request.id)}>
                    Acknowledge
                  </button>
                {/if}
                <button
                  type="button"
                  style="flex:1;padding:8px 12px;border-radius:10px;border:1px solid rgba(34,197,94,0.25);background:rgba(34,197,94,0.1);color:#16a34a;font-size:12px;font-weight:700;cursor:pointer;font-family:'Cabinet Grotesk',system-ui,sans-serif;"
                  onclick={() => handleResolveRequest(request.id)}
                >
                  Resolve
                </button>
              </div>
            </div>
          {/each}
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  @media (min-width: 1024px) {
    .dash-grid {
      grid-template-columns: 1.6fr 1fr !important;
    }
  }
</style>
