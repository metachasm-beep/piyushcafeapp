<script lang="ts">
  import {
    TrendingUp,
    Users,
    ShoppingBag,
    Store,
    ArrowUpRight,
    ArrowDownRight,
    AlertTriangle,
    Printer,
    ExternalLink
  } from 'lucide-svelte';
  import { formatCurrency } from '$lib/utils';
  import { saRestaurantId } from '$lib/stores/saContext';

  // Demo telemetry — marked as sample; health signals first
  const health = {
    printersOffline: 1,
    highVolume: 1,
    degradedNodes: 0,
    lastSyncMinutes: 2
  };

  const stats = [
    { label: 'Revenue (MTD)', value: 24589.5, isCurrency: true, trend: 12.5, up: true, icon: TrendingUp },
    { label: 'Active nodes', value: 12, isCurrency: false, trend: 0, up: true, icon: Store },
    { label: 'Orders today', value: 843, isCurrency: false, trend: 8.2, up: true, icon: ShoppingBag },
    { label: 'Open sessions', value: 1245, isCurrency: false, trend: -2.4, up: false, icon: Users },
  ];

  type LogEvent = {
    restaurant: string;
    action: string;
    time: string;
    status: 'OK' | 'WARN' | 'ERR' | 'INFO';
    href: string;
  };

  const recentActivity: LogEvent[] = [
    { restaurant: 'Downtown Bistro', action: 'Menu item added', time: '10:42', status: 'OK', href: '/superadmin/menu' },
    { restaurant: 'Westside Grill', action: 'High volume alert', time: '10:25', status: 'WARN', href: '/superadmin' },
    { restaurant: 'North Branch', action: 'Printer disconnected', time: '09:12', status: 'ERR', href: '/superadmin/tables' },
    { restaurant: 'Eastside Cafe', action: 'Daily report ready', time: '08:00', status: 'INFO', href: '/superadmin' },
    { restaurant: 'Midtown Diner', action: 'Order #8842 canceled', time: '07:45', status: 'WARN', href: '/superadmin' },
    { restaurant: 'South Station', action: 'Node boot OK', time: '06:30', status: 'OK', href: '/superadmin/restaurants' },
  ];

  const barHeights = [45, 70, 55, 80, 65, 90, 60];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const amounts = [12400, 18700, 14200, 22100, 17600, 31400, 19800];

  function statusMeta(s: LogEvent['status']) {
    if (s === 'OK') return { color: 'var(--sa-ok)', label: 'OK', badge: 'sa-badge-active' };
    if (s === 'WARN') return { color: 'var(--sa-warn)', label: 'WARN', badge: 'sa-badge-warn' };
    if (s === 'ERR') return { color: 'var(--sa-err)', label: 'ERR', badge: 'sa-badge-err' };
    return { color: 'var(--sa-info)', label: 'INFO', badge: 'sa-badge-info' };
  }

  let scopedId = $state<string | null>(null);
  $effect(() => {
    const u = saRestaurantId.subscribe((v) => (scopedId = v));
    return () => u();
  });

  const attentionCount = $derived(health.printersOffline + health.highVolume + health.degradedNodes);
</script>

<svelte:head><title>Dashboard · Superadmin</title></svelte:head>

<div>
  <div class="sa-page-header">
    <div>
      <h1 class="sa-page-title">Operations</h1>
      <p class="sa-page-subtitle">
        Sample telemetry · sync {health.lastSyncMinutes}m ago
        {#if scopedId}
          · scoped node
        {/if}
      </p>
    </div>
    <button
      type="button"
      class="sa-btn-secondary"
      onclick={() => import('svelte-sonner').then((m) => m.toast.success('CSV export queued'))}
    >
      Export CSV
    </button>
  </div>

  <!-- Health first -->
  <div class="sa-tile sa-tile-static" style="padding:var(--sa-density-pad);margin-bottom:var(--sa-density-gap);">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;">
      <div>
        <div style="font-size:11px;font-family:var(--sa-mono);text-transform:uppercase;letter-spacing:0.07em;color:var(--sa-muted);margin-bottom:6px;">Network health</div>
        <div style="font-size:22px;font-weight:800;letter-spacing:-0.03em;color:var(--sa-ink);">
          {#if attentionCount === 0}
            All clear
          {:else}
            {attentionCount} item{attentionCount === 1 ? '' : 's'} need attention
          {/if}
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        {#if health.printersOffline}
          <a href="/superadmin/tables" class="sa-badge-err" style="text-decoration:none;">
            <Printer size={12} /> {health.printersOffline} printer offline
          </a>
        {/if}
        {#if health.highVolume}
          <span class="sa-badge-warn">
            <AlertTriangle size={12} /> {health.highVolume} high volume
          </span>
        {/if}
        {#if health.degradedNodes === 0}
          <span class="sa-badge-active">Nodes responsive</span>
        {/if}
      </div>
    </div>
  </div>

  <div class="sa-dash-stats" style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--sa-density-gap);margin-bottom:var(--sa-density-gap);">
    {#each stats as stat}
      <div class="sa-tile" style="padding:var(--sa-density-pad);">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <span style="font-size:11px;font-family:var(--sa-mono);text-transform:uppercase;letter-spacing:0.07em;color:var(--sa-muted);">{stat.label}</span>
          <div style="width:32px;height:32px;border-radius:var(--sa-radius-sm);background:var(--sa-accent-soft);display:flex;align-items:center;justify-content:center;color:var(--sa-accent);">
            <stat.icon size={15} strokeWidth={2} />
          </div>
        </div>
        <div class="sa-num" style="font-size:28px;font-weight:900;letter-spacing:-0.04em;color:var(--sa-ink);line-height:1;margin-bottom:8px;">
          {stat.isCurrency ? formatCurrency(stat.value) : stat.value.toLocaleString()}
        </div>
        {#if stat.trend !== 0}
          <div style="display:flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:{stat.up ? 'var(--sa-ok)' : 'var(--sa-err)'};">
            {#if stat.up}<ArrowUpRight size={13} />{:else}<ArrowDownRight size={13} />{/if}
            <span class="sa-num">{Math.abs(stat.trend)}%</span> vs prior
          </div>
        {:else}
          <div style="font-size:12px;color:var(--sa-faint);">Flat</div>
        {/if}
      </div>
    {/each}
  </div>

  <div class="sa-dash-bottom" style="display:grid;grid-template-columns:1fr 340px;gap:var(--sa-density-gap);">
    <div class="sa-tile" style="padding:var(--sa-density-pad);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;gap:12px;flex-wrap:wrap;">
        <div>
          <div style="font-size:16px;font-weight:800;color:var(--sa-ink);letter-spacing:-0.02em;">Revenue · 7d</div>
          <div style="font-size:11px;font-family:var(--sa-mono);color:var(--sa-muted);margin-top:2px;">Sample data</div>
        </div>
        <div class="sa-num" style="font-size:20px;font-weight:900;color:var(--sa-accent);letter-spacing:-0.03em;">
          {formatCurrency(amounts.reduce((a, b) => a + b, 0))}
        </div>
      </div>
      <div style="display:flex;align-items:flex-end;gap:8px;height:150px;position:relative;">
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;justify-content:space-between;pointer-events:none;">
          {#each [0, 1, 2, 3] as _}
            <div style="width:100%;height:1px;background:var(--sa-line);"></div>
          {/each}
        </div>
        {#each barHeights as h, i}
          <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:8px;z-index:1;">
            <div
              style="width:100%;border-radius:calc(var(--sa-radius-sm) - 2px) calc(var(--sa-radius-sm) - 2px) 4px 4px;background:linear-gradient(180deg,var(--sa-accent-strong),rgba(15,118,110,0.45));height:{h}%;min-height:8px;cursor:default;"
              title="{days[i]}: {formatCurrency(amounts[i])}"
            ></div>
            <span style="font-size:10px;font-family:var(--sa-mono);color:var(--sa-muted);">{days[i]}</span>
          </div>
        {/each}
      </div>
    </div>

    <div class="sa-tile sa-tile-static" style="padding:var(--sa-density-pad);display:flex;flex-direction:column;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <div style="font-size:15px;font-weight:800;color:var(--sa-ink);letter-spacing:-0.02em;">System log</div>
        <span style="font-size:10px;font-family:var(--sa-mono);color:var(--sa-muted);text-transform:uppercase;">Demo</span>
      </div>
      <div style="flex:1;display:flex;flex-direction:column;gap:8px;overflow-y:auto;">
        {#each recentActivity as event}
          {@const meta = statusMeta(event.status)}
          <a href={event.href} class="sa-log-link">
            <div style="flex:1;min-width:0;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px;">
                <span class={meta.badge} style="font-size:10px;padding:2px 7px;">{meta.label}</span>
                <span class="sa-num" style="font-size:10px;font-family:var(--sa-mono);color:var(--sa-faint);">{event.time}</span>
              </div>
              <div style="font-size:12px;font-weight:700;color:var(--sa-ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{event.restaurant}</div>
              <div style="font-size:11px;color:var(--sa-muted);margin-top:1px;">{event.action}</div>
            </div>
            <ExternalLink size={12} style="color:var(--sa-faint);flex-shrink:0;margin-top:4px;" />
          </a>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  :global(.sa-log-link) {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 10px 12px;
    border-radius: var(--sa-radius-sm);
    background: rgba(255, 255, 255, 0.4);
    border: 1px solid var(--sa-line);
    text-decoration: none;
    color: inherit;
    transition: border-color var(--sa-duration), background var(--sa-duration);
  }
  :global(.sa-log-link:hover) {
    border-color: var(--sa-accent-line);
    background: var(--sa-accent-soft);
  }
  :global(.sa-log-link:focus-visible) {
    outline: 2px solid var(--sa-accent);
    outline-offset: 2px;
  }
</style>
