<script lang="ts">
  import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Star, Clock, Users, ArrowUpRight, Activity } from 'lucide-svelte';
  import { formatCurrency } from '$lib/utils';
  import { onMount } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  
  let { data } = $props();
  
  // Basic derived stats
  let totalRevenue = $derived(data.orders.filter((o: any) => o.status === 'paid' || o.status === 'served').reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0));
  let totalOrders = $derived(data.orders.length);
  let averageOrderValue = $derived(totalOrders > 0 ? totalRevenue / totalOrders : 0);
  
  // Feedback stats
  let averageRating = $derived(data.feedback.length > 0 ? (data.feedback.reduce((sum: number, f: any) => sum + f.rating, 0) / data.feedback.length).toFixed(1) : 'N/A');
  let feedbackCount = $derived(data.feedback.length);
  
  // Best selling items
  let itemSales = $derived(() => {
    const sales: Record<string, { qty: number, rev: number }> = {};
    for (const o of data.orders) {
      if (!o.order_items) continue;
      for (const i of o.order_items) {
        if (!sales[i.menu_item_id]) sales[i.menu_item_id] = { qty: 0, rev: 0 };
        sales[i.menu_item_id].qty += i.quantity;
        sales[i.menu_item_id].rev += (i.unit_price * i.quantity);
      }
    }
    return Object.entries(sales)
      .map(([id, stats]) => ({
        id,
        name: data.menuItems.find((m: any) => m.id === id)?.name || 'Unknown Item',
        ...stats
      }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  });
  
  // Peak Hours
  let peakHours = $derived(() => {
    const hours: Record<number, number> = {};
    for (const o of data.orders) {
      const hour = new Date(o.created_at).getHours();
      hours[hour] = (hours[hour] || 0) + 1;
    }
    return Object.entries(hours)
      .map(([h, count]) => ({ hour: parseInt(h), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  });

  // Loading State
  let loading = $state(true);
  onMount(() => {
    // Artificial delay to show skeletal loaders
    setTimeout(() => {
      loading = false;
    }, 800);
  });
</script>

<div class="space-y-6 pb-12 max-w-7xl mx-auto">
  <header>
    <h1 class="text-3xl font-bold tracking-tight text-zinc-950">Intelligence</h1>
    <p class="text-sm font-medium text-zinc-500 mt-1">Data-driven insights and telemetry.</p>
  </header>

  {#if loading}
    <!-- Skeletal Loaders (Bento Grid) -->
    <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[minmax(120px,auto)]">
      <!-- Hero Skeleton -->
      <div class="md:col-span-2 md:row-span-2 rounded-2xl bg-zinc-100 animate-pulse border border-zinc-200 min-h-[260px] p-6 flex flex-col justify-between">
        <div class="h-6 w-32 bg-zinc-200 rounded-md"></div>
        <div>
          <div class="h-12 w-48 bg-zinc-200 rounded-md mb-4"></div>
          <div class="h-4 w-24 bg-zinc-200 rounded-md"></div>
        </div>
      </div>
      <!-- Metric Skeletons -->
      {#each Array(3) as _}
        <div class="rounded-2xl bg-zinc-100 animate-pulse border border-zinc-200 p-6 flex flex-col justify-between">
          <div class="h-5 w-24 bg-zinc-200 rounded-md mb-8"></div>
          <div class="h-8 w-16 bg-zinc-200 rounded-md"></div>
        </div>
      {/each}
      <!-- List Skeletons -->
      <div class="md:col-span-3 lg:col-span-2 rounded-2xl bg-zinc-100 animate-pulse border border-zinc-200 min-h-[300px] p-6">
        <div class="h-6 w-40 bg-zinc-200 rounded-md mb-6"></div>
        <div class="space-y-4">
          {#each Array(4) as _}
            <div class="flex items-center gap-4">
              <div class="w-8 h-8 rounded-md bg-zinc-200"></div>
              <div class="flex-1 h-8 rounded-md bg-zinc-200"></div>
            </div>
          {/each}
        </div>
      </div>
      <div class="md:col-span-3 lg:col-span-2 rounded-2xl bg-zinc-100 animate-pulse border border-zinc-200 min-h-[300px] p-6"></div>
    </div>
  {:else}
    <!-- Bento Grid Content -->
    <div in:fade={{ duration: 400 }} class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[minmax(120px,auto)]">
      
      <!-- Hero Metric (Revenue) -->
      <div in:fly={{ y: 20, duration: 400, delay: 0 }} class="md:col-span-2 md:row-span-2 rounded-2xl border border-zinc-200 bg-zinc-950 p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group">
        <div class="absolute inset-0 bg-gradient-to-br from-zinc-900 to-zinc-950 -z-10"></div>
        <!-- Decorative bg pattern -->
        <div class="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
        
        <div class="flex items-center justify-between z-10">
          <div class="flex items-center gap-2 text-zinc-400">
            <DollarSign size={16} />
            <span class="text-xs font-bold uppercase tracking-widest">Total Revenue</span>
          </div>
          <div class="p-2 bg-zinc-900 rounded-full border border-zinc-800 text-zinc-500">
            <Activity size={16} />
          </div>
        </div>
        <div class="mt-8 z-10">
          <div class="text-5xl md:text-6xl font-bold tracking-tighter text-white mb-2">{formatCurrency(totalRevenue)}</div>
          <p class="text-sm font-medium text-emerald-400 flex items-center gap-1">
            <TrendingUp size={14} /> +12.5% vs yesterday
          </p>
        </div>
      </div>
      
      <!-- Standard Metrics -->
      <div in:fly={{ y: 20, duration: 400, delay: 50 }} class="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between mb-6">
          <span class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total Orders</span>
          <ShoppingBag size={14} class="text-zinc-400" />
        </div>
        <div class="text-3xl font-bold tracking-tighter text-zinc-950">{totalOrders}</div>
      </div>
      
      <div in:fly={{ y: 20, duration: 400, delay: 100 }} class="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between mb-6">
          <span class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Avg Order Val</span>
          <ArrowUpRight size={14} class="text-zinc-400" />
        </div>
        <div class="text-3xl font-bold tracking-tighter text-zinc-950">{formatCurrency(averageOrderValue)}</div>
      </div>

      <div in:fly={{ y: 20, duration: 400, delay: 150 }} class="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow md:col-span-3 lg:col-span-2">
        <div class="flex items-center justify-between mb-4">
          <span class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Customer Satisfaction</span>
          <Star size={14} class="text-yellow-500" />
        </div>
        <div class="flex items-end gap-3">
          <span class="text-4xl font-bold tracking-tighter text-zinc-950">{averageRating}</span>
          <div class="pb-1">
            <div class="flex gap-0.5 text-yellow-400 mb-0.5">
              {#each Array(5) as _, i}
                <Star size={12} fill={i < Math.round(Number(averageRating) || 0) ? 'currentColor' : 'none'} class={i >= Math.round(Number(averageRating) || 0) ? 'text-zinc-200' : ''} />
              {/each}
            </div>
            <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Based on {feedbackCount} reviews</span>
          </div>
        </div>
      </div>

      <!-- Best Selling Items -->
      <div in:fly={{ y: 20, duration: 400, delay: 200 }} class="md:col-span-3 lg:col-span-2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm flex flex-col">
        <h3 class="font-bold text-xs uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
          <TrendingUp class="text-emerald-500" size={16} /> Velocity Leaders
        </h3>
        <div class="space-y-4 flex-1">
          {#each itemSales() as item, i}
            <div class="flex items-center gap-4 group">
              <div class="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-100 text-zinc-400 flex items-center justify-center font-bold text-xs transition-colors group-hover:bg-zinc-900 group-hover:text-white group-hover:border-zinc-800">
                0{i + 1}
              </div>
              <div class="flex-1">
                <h4 class="font-bold text-sm tracking-tight text-zinc-900">{item.name}</h4>
                <div class="w-full bg-zinc-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div class="bg-zinc-900 h-full rounded-full" style="width: {(item.qty / (itemSales()[0]?.qty || 1)) * 100}%"></div>
                </div>
              </div>
              <div class="text-right">
                <div class="font-bold text-sm tracking-tight text-zinc-950">
                  {formatCurrency(item.rev)}
                </div>
                <div class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">{item.qty} u</div>
              </div>
            </div>
          {/each}
          {#if itemSales().length === 0}
            <div class="h-full flex items-center justify-center text-zinc-400 text-xs font-bold uppercase tracking-widest border-2 border-dashed border-zinc-100 rounded-xl">No telemetry available</div>
          {/if}
        </div>
      </div>

      <!-- Peak Hours -->
      <div in:fly={{ y: 20, duration: 400, delay: 250 }} class="md:col-span-3 lg:col-span-2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h3 class="font-bold text-xs uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
          <Clock class="text-blue-500" size={16} /> Heatmap
        </h3>
        <div class="space-y-3">
          {#each peakHours() as ph}
            <div class="flex items-center justify-between p-3 rounded-xl border border-zinc-100 bg-zinc-50/50 hover:bg-zinc-100/50 transition-colors">
              <div class="font-bold text-sm tracking-tight text-zinc-900 flex items-center gap-3">
                <div class="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                {ph.hour === 0 ? '12:00 AM' : ph.hour < 12 ? `${ph.hour}:00 AM` : ph.hour === 12 ? '12:00 PM' : `${ph.hour - 12}:00 PM`}
              </div>
              <div class="text-[10px] font-bold uppercase tracking-widest bg-zinc-900 text-white px-2.5 py-1 rounded-md shadow-sm">
                {ph.count} {ph.count === 1 ? 'Order' : 'Orders'}
              </div>
            </div>
          {/each}
          {#if peakHours().length === 0}
            <div class="h-32 flex items-center justify-center text-zinc-400 text-xs font-bold uppercase tracking-widest border-2 border-dashed border-zinc-100 rounded-xl">Insufficient Data</div>
          {/if}
        </div>
      </div>
      
      <!-- Recent Feedback (Full Width) -->
      <div in:fly={{ y: 20, duration: 400, delay: 300 }} class="md:col-span-3 lg:col-span-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h3 class="font-bold text-xs uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
          <Users class="text-purple-500" size={16} /> Raw Feedback Logs
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {#each [...data.feedback].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6) as review, i}
            <div class="bg-zinc-50 p-5 rounded-xl border border-zinc-100 flex flex-col gap-3 group hover:border-zinc-200 transition-colors">
              <div class="flex items-center justify-between">
                <div class="flex gap-0.5 text-yellow-400">
                  {#each Array(5) as _, i}
                    <Star size={12} fill={i < review.rating ? 'currentColor' : 'none'} class={i >= review.rating ? 'text-zinc-200' : ''} />
                  {/each}
                </div>
                <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
              {#if review.comment}
                <p class="text-sm font-medium text-zinc-800 italic leading-relaxed text-pretty">"{review.comment}"</p>
              {:else}
                <p class="text-xs font-medium text-zinc-400 italic">No comment appended.</p>
              {/if}
            </div>
          {/each}
          {#if data.feedback.length === 0}
            <div class="col-span-full h-32 flex items-center justify-center text-zinc-400 text-xs font-bold uppercase tracking-widest border-2 border-dashed border-zinc-100 rounded-xl">No logs found</div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>
