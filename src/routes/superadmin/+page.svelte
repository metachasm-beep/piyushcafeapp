<script lang="ts">
  import { TrendingUp, Users, ShoppingBag, Store, ArrowUpRight, ArrowDownRight, Activity, Zap } from 'lucide-svelte';
  import { formatCurrency } from '$lib/utils';

  const stats = [
    { label: 'Total Revenue', value: 24589.50, isCurrency: true, trend: 12.5, up: true, color: '#6366f1', bg: 'rgba(99,102,241,0.08)', icon: TrendingUp },
    { label: 'Active Restaurants', value: 12, isCurrency: false, trend: 0, up: true, color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', icon: Store },
    { label: 'Total Orders Today', value: 843, isCurrency: false, trend: 8.2, up: true, color: '#06b6d4', bg: 'rgba(6,182,212,0.08)', icon: ShoppingBag },
    { label: 'Active Sessions', value: 1245, isCurrency: false, trend: -2.4, up: false, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', icon: Users },
  ];

  const recentActivity = [
    { restaurant: 'Downtown Bistro', action: 'New menu item added', time: '10:42', status: 'OK' },
    { restaurant: 'Westside Grill', action: 'High volume alert', time: '10:25', status: 'WARN' },
    { restaurant: 'North Branch', action: 'Printer disconnected', time: '09:12', status: 'ERR' },
    { restaurant: 'Eastside Cafe', action: 'Daily report generated', time: '08:00', status: 'INFO' },
    { restaurant: 'Midtown Diner', action: 'Order #8842 canceled', time: '07:45', status: 'WARN' },
    { restaurant: 'South Station', action: 'System boot OK', time: '06:30', status: 'OK' },
  ];

  const barHeights = [45, 70, 55, 80, 65, 90, 60];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const amounts = [12400, 18700, 14200, 22100, 17600, 31400, 19800];

  function statusColor(s: string) {
    if (s === 'OK') return '#22c55e';
    if (s === 'WARN') return '#f59e0b';
    if (s === 'ERR') return '#ef4444';
    return '#6366f1';
  }
</script>

<svelte:head><title>Dashboard · Superadmin</title></svelte:head>

<div style="font-family:'Cabinet Grotesk',system-ui,sans-serif;color:#1e1b4b;">
  <!-- Page header -->
  <div class="sa-page-header">
    <div>
      <h1 class="sa-page-title">Network Dashboard</h1>
      <p class="sa-page-subtitle">Real-time telemetry across all restaurant nodes</p>
    </div>
    <div style="display:flex;gap:10px;">
      <button class="sa-btn-primary" onclick={() => import('svelte-sonner').then(m => m.toast.success('Report exported'))}>
        Export Report
      </button>
    </div>
  </div>

  <!-- Bento grid -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:auto;gap:16px;margin-bottom:20px;">
    {#each stats as stat, i}
      <div class="sa-tile" style="padding:22px 24px;position:relative;overflow:hidden;">
        <div style="position:absolute;top:-20px;right:-20px;width:80px;height:80px;border-radius:50%;background:{stat.bg};filter:blur(20px);"></div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
          <span style="font-size:11px;font-family:'Geist Mono',monospace;text-transform:uppercase;letter-spacing:0.07em;color:#8b84c0;">{stat.label}</span>
          <div style="width:32px;height:32px;border-radius:10px;background:{stat.bg};display:flex;align-items:center;justify-content:center;color:{stat.color};">
            <stat.icon size={15} strokeWidth={2} />
          </div>
        </div>
        <div style="font-size:30px;font-weight:900;letter-spacing:-0.04em;color:#1e1b4b;line-height:1;margin-bottom:10px;font-variant-numeric:tabular-nums;">
          {stat.isCurrency ? formatCurrency(stat.value) : stat.value.toLocaleString()}
        </div>
        {#if stat.trend !== 0}
          <div style="display:flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:{stat.up ? '#16a34a' : '#dc2626'};">
            {#if stat.up}<ArrowUpRight size={13} />{:else}<ArrowDownRight size={13} />{/if}
            {Math.abs(stat.trend)}% vs last month
          </div>
        {:else}
          <div style="font-size:12px;color:#9ca3af;">No change</div>
        {/if}
      </div>
    {/each}
  </div>

  <!-- Bottom row: chart + activity log -->
  <div style="display:grid;grid-template-columns:1fr 340px;gap:16px;">

    <!-- Revenue chart tile -->
    <div class="sa-tile" style="padding:28px 28px 24px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
        <div>
          <div style="font-size:17px;font-weight:800;color:#1e1b4b;letter-spacing:-0.02em;">Revenue Stream</div>
          <div style="font-size:11px;font-family:'Geist Mono',monospace;color:#8b84c0;margin-top:2px;text-transform:uppercase;letter-spacing:0.06em;">Past 7 days</div>
        </div>
        <div style="font-size:22px;font-weight:900;color:#6366f1;letter-spacing:-0.03em;">
          {formatCurrency(amounts.reduce((a,b) => a+b, 0))}
        </div>
      </div>
      <!-- Bar chart -->
      <div style="display:flex;align-items:flex-end;gap:8px;height:160px;position:relative;">
        <!-- Grid lines -->
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;justify-content:space-between;pointer-events:none;">
          {#each [0,1,2,3] as _}
            <div style="width:100%;height:1px;background:rgba(99,102,241,0.08);"></div>
          {/each}
        </div>
        {#each barHeights as h, i}
          <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:8px;z-index:1;">
            <div
              style="width:100%;border-radius:8px 8px 4px 4px;background:linear-gradient(180deg,rgba(99,102,241,0.8),rgba(139,92,246,0.5));height:{h}%;min-height:8px;transition:opacity 0.15s;cursor:pointer;"
              title="{days[i]}: {formatCurrency(amounts[i])}"
            ></div>
            <span style="font-size:10px;font-family:'Geist Mono',monospace;color:#8b84c0;">{days[i]}</span>
          </div>
        {/each}
      </div>
    </div>

    <!-- Activity log tile -->
    <div class="sa-tile" style="padding:24px 22px;display:flex;flex-direction:column;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
        <div style="font-size:15px;font-weight:800;color:#1e1b4b;letter-spacing:-0.02em;">System Log</div>
        <div style="display:flex;align-items:center;gap:5px;">
          <div style="width:5px;height:5px;border-radius:50%;background:#22c55e;box-shadow:0 0 6px rgba(34,197,94,0.7);"></div>
          <span style="font-size:10px;font-family:'Geist Mono',monospace;color:#8b84c0;text-transform:uppercase;letter-spacing:0.05em;">Live</span>
        </div>
      </div>
      <div style="flex:1;display:flex;flex-direction:column;gap:12px;overflow-y:auto;">
        {#each recentActivity as event}
          <div style="display:flex;gap:10px;align-items:flex-start;padding:8px 10px;border-radius:10px;background:rgba(99,102,241,0.04);border:1px solid rgba(99,102,241,0.07);">
            <div style="width:6px;height:6px;border-radius:50%;background:{statusColor(event.status)};margin-top:5px;flex-shrink:0;box-shadow:0 0 5px {statusColor(event.status)};"></div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:12px;font-weight:700;color:#1e1b4b;truncate;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{event.restaurant}</div>
              <div style="font-size:11px;color:#8b84c0;margin-top:1px;">{event.action}</div>
            </div>
            <span style="font-size:10px;font-family:'Geist Mono',monospace;color:#9ca3af;flex-shrink:0;">{event.time}</span>
          </div>
        {/each}
        <div style="display:flex;gap:10px;align-items:center;padding:8px 10px;border-radius:10px;background:rgba(99,102,241,0.03);">
          <div style="width:6px;height:6px;border-radius:50%;background:#6366f1;animation:pulse 1.5s infinite;"></div>
          <span style="font-size:11px;font-family:'Geist Mono',monospace;color:#a5b4fc;">Waiting for events...</span>
        </div>
      </div>
    </div>

  </div>
</div>
