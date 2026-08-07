<script lang="ts">
  import { TrendingUp, Users, ShoppingBag, Store, ArrowUpRight, ArrowDownRight, Activity, Zap } from 'lucide-svelte';
  import { formatCurrency } from '$lib/utils';
  import InteractiveRevenueChart from '$lib/components/InteractiveRevenueChart.svelte';
  import LiveOrderParticles from '$lib/components/LiveOrderParticles.svelte';
  import { slide, fade } from 'svelte/transition';
  import { tooltip } from '$lib/actions/tooltip';
  import { toast } from 'svelte-sonner';

  let expandedStatIndex = $state<number | null>(null);

  let { data }: { data: PageData } = $props();

  // Historical data for sparklines (placeholder for actual implementation)
  const sparklineData = [
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0]
  ];

  let stats = $derived([
    { label: 'Total Revenue', value: data.stats.totalRevenue, isCurrency: true, trend: 12, up: true, color: '#6366f1', bg: 'rgba(99,102,241,0.08)', icon: TrendingUp, sparkline: sparklineData[0], target: 150000 },
    { label: 'Platform Fees', value: data.stats.platformFees, isCurrency: true, trend: 8, up: true, color: '#22c55e', bg: 'rgba(34,197,94,0.08)', icon: Activity, sparkline: sparklineData[1], target: 3000 },
    { label: 'Active Restaurants', value: data.stats.activeRestaurantsCount, isCurrency: false, trend: 0, up: true, color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', icon: Store, sparkline: sparklineData[2], target: 5 },
    { label: 'Total Orders Today', value: data.stats.totalOrdersToday, isCurrency: false, trend: -3, up: false, color: '#06b6d4', bg: 'rgba(6,182,212,0.08)', icon: ShoppingBag, sparkline: sparklineData[3], target: 200 },
  ]);

  // Helper to generate SVG path for sparkline
  function getSparklinePath(data: number[], width: number, height: number) {
    if (!data || data.length === 0) return '';
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const stepX = width / (data.length - 1);
    
    return data.map((val, i) => {
      const x = i * stepX;
      const y = height - ((val - min) / range) * height;
      return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
    }).join(' ');
  }

  let recentActivity = $derived(data.recentActivity);

  // Use the chart data generated from the server
  let chartData = $derived(data.chartData.map(d => ({ date: new Date(d.date), revenue: d.revenue })));

  let amounts = $derived(chartData.map(d => d.revenue));

  function statusColor(s: string) {
    if (s === 'OK') return '#22c55e';
    if (s === 'WARN') return '#f59e0b';
    if (s === 'ERR') return '#ef4444';
    return '#6366f1';
  }

  // Pull to refresh logic
  let startY = 0;
  let currentY = $state(0);
  let isRefreshing = $state(false);

  function handleTouchStart(e: TouchEvent) {
    if (window.scrollY === 0) {
      startY = e.touches[0].clientY;
    }
  }

  function handleTouchMove(e: TouchEvent) {
    if (startY > 0) {
      const y = e.touches[0].clientY;
      if (y > startY) {
        currentY = Math.min((y - startY) * 0.4, 80);
        if (e.cancelable) e.preventDefault();
      }
    }
  }

  function handleTouchEnd() {
    if (currentY > 60 && !isRefreshing) {
      isRefreshing = true;
      toast.success('Refreshing data...');
      // Simulate network request
      setTimeout(() => {
        isRefreshing = false;
        currentY = 0;
        startY = 0;
      }, 1500);
    } else {
      currentY = 0;
      startY = 0;
    }
  }
</script>

<svelte:head><title>Dashboard · Superadmin</title></svelte:head>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div 
  style="font-family:'Cabinet Grotesk',system-ui,sans-serif;color:#1e1b4b;position:relative;z-index:1; transform: translateY({currentY}px); transition: {isRefreshing ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'};"
  ontouchstart={handleTouchStart}
  ontouchmove={handleTouchMove}
  ontouchend={handleTouchEnd}
>
  {#if currentY > 0}
    <div style="position:absolute;top:-50px;left:0;right:0;display:flex;justify-content:center;align-items:center;height:50px;">
      <div style="width:24px;height:24px;border-radius:50%;border:2px solid #6366f1;border-top-color:transparent;animation:spin 1s linear infinite; opacity: {Math.min(currentY / 60, 1)}; transform: rotate({currentY * 5}deg);"></div>
    </div>
  {/if}

  <LiveOrderParticles />
  
  <!-- Page header -->
  <div class="sa-page-header">
    <div>
      <h1 class="sa-page-title">Network Dashboard</h1>
      <p class="sa-page-subtitle">Real-time telemetry across all restaurant nodes</p>
    </div>
    <div style="display:flex;gap:10px;">
      <button class="sa-btn-primary" onclick={() => import('svelte-sonner').then(m => m.toast.success('Report exported'))} use:tooltip={"Export CSV Report"}>
        Export Report
      </button>
    </div>
  </div>

  <!-- Bento grid -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
    {#each stats as stat, i}
      {#if expandedStatIndex === null || expandedStatIndex === i}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div 
          class="sa-tile" 
          style="padding:22px 24px;position:relative;overflow:hidden;cursor:pointer; grid-column: {expandedStatIndex === i ? '1 / -1' : 'auto'};"
          onclick={() => expandedStatIndex = expandedStatIndex === i ? null : i}
          in:fade={{ duration: 200 }}
          use:tooltip={`View breakdown for ${stat.label}`}
        >
          <div style="position:absolute;top:-20px;right:-20px;width:80px;height:80px;border-radius:50%;background:{stat.bg};filter:blur(20px);"></div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
            <span style="font-size:11px;font-family:'Geist Mono',monospace;text-transform:uppercase;letter-spacing:0.07em;color:#8b84c0;">{stat.label}</span>
            <div style="width:32px;height:32px;border-radius:10px;background:{stat.bg};display:flex;align-items:center;justify-content:center;color:{stat.color};">
              <stat.icon size={15} strokeWidth={2} />
            </div>
          </div>
          <div style="font-size:30px;font-weight:900;letter-spacing:-0.04em;color:#1e1b4b;line-height:1;margin-bottom:12px;font-variant-numeric:tabular-nums;">
            {stat.isCurrency ? formatCurrency(stat.value) : stat.value.toLocaleString()}
          </div>
          
          <!-- Pacing Gauge / Progress -->
          <div style="margin-bottom: 12px;">
            <div style="display:flex; justify-content:space-between; font-size:10px; color:#8b84c0; margin-bottom:4px; font-family:'Geist Mono',monospace;">
              <span>Target: {stat.isCurrency ? formatCurrency(stat.target) : stat.target}</span>
              <span>{Math.round((stat.value / stat.target) * 100)}%</span>
            </div>
            <div style="width:100%; height:4px; background:rgba(0,0,0,0.05); border-radius:2px; overflow:hidden;">
              <div style="height:100%; background:{stat.color}; width:{Math.min(100, (stat.value / stat.target) * 100)}%; border-radius:2px;"></div>
            </div>
          </div>

          <div style="display:flex; align-items:center; justify-content:space-between;">
            {#if stat.trend !== 0}
              <div style="display:flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:{stat.up ? '#16a34a' : '#dc2626'};">
                {#if stat.up}<ArrowUpRight size={13} />{:else}<ArrowDownRight size={13} />{/if}
                {Math.abs(stat.trend)}% vs last month
              </div>
            {:else}
              <div style="font-size:12px;color:#9ca3af;">No change</div>
            {/if}
            
            <!-- Sparkline -->
            <svg width="60" height="20" viewBox="0 0 60 20" style="overflow:visible;">
              <path d={getSparklinePath(stat.sparkline, 60, 20)} fill="none" stroke="{stat.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>

          {#if expandedStatIndex === i}
            <div transition:slide={{ duration: 300 }} style="margin-top:24px;padding-top:24px;border-top:1px solid rgba(0,0,0,0.05);">
              <h3 style="font-size:14px;font-weight:800;color:#1e1b4b;margin-bottom:12px;">Detailed Breakdown</h3>
              <table style="width:100%;text-align:left;font-size:13px;border-collapse:collapse;">
                <thead>
                  <tr style="color:#8b84c0;font-family:'Geist Mono',monospace;font-size:10px;text-transform:uppercase;">
                    <th style="padding-bottom:8px;font-weight:500;">Restaurant</th>
                    <th style="padding-bottom:8px;font-weight:500;">Value</th>
                    <th style="padding-bottom:8px;font-weight:500;">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="border-top:1px solid rgba(0,0,0,0.05);">
                    <td style="padding:10px 0;font-weight:600;color:#1e1b4b;">The Golden Fork</td>
                    <td style="padding:10px 0;">{stat.isCurrency ? formatCurrency(stat.value * 0.4) : Math.round(stat.value * 0.4)}</td>
                    <td style="padding:10px 0;color:#16a34a;">+12%</td>
                  </tr>
                  <tr style="border-top:1px solid rgba(0,0,0,0.05);">
                    <td style="padding:10px 0;font-weight:600;color:#1e1b4b;">Spice Symphony</td>
                    <td style="padding:10px 0;">{stat.isCurrency ? formatCurrency(stat.value * 0.35) : Math.round(stat.value * 0.35)}</td>
                    <td style="padding:10px 0;color:#16a34a;">+5%</td>
                  </tr>
                  <tr style="border-top:1px solid rgba(0,0,0,0.05);">
                    <td style="padding:10px 0;font-weight:600;color:#1e1b4b;">Urban Bites</td>
                    <td style="padding:10px 0;">{stat.isCurrency ? formatCurrency(stat.value * 0.25) : Math.round(stat.value * 0.25)}</td>
                    <td style="padding:10px 0;color:#dc2626;">-2%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          {/if}
        </div>
      {/if}
    {/each}
  </div>

  <!-- Bottom row: chart + activity log -->
  <div class="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">

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
      <!-- Interactive Chart -->
      <div style="height:200px;position:relative; margin-top:20px;">
        <InteractiveRevenueChart data={chartData} />
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
