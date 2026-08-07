<script lang="ts">
  import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Star, Clock, Users, ArrowUpRight } from 'lucide-svelte';
  import { formatCurrency } from '$lib/utils';
  
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
</script>

<div class="space-y-6">
  <header>
    <h1 class="text-3xl font-display font-bold text-[var(--color-text-primary)]">Analytics & Reports</h1>
    <p class="text-[var(--color-text-secondary)] mt-1">Track your restaurant's performance</p>
  </header>

  <!-- Key Metrics -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="glass p-5 rounded-2xl flex flex-col gap-2">
      <div class="flex items-center gap-2 text-[var(--color-text-secondary)]">
        <DollarSign size={18} />
        <span class="font-medium">Total Revenue</span>
      </div>
      <div class="text-3xl font-display font-bold text-[var(--color-text-primary)]">{formatCurrency(totalRevenue)}</div>
    </div>
    
    <div class="glass p-5 rounded-2xl flex flex-col gap-2">
      <div class="flex items-center gap-2 text-[var(--color-text-secondary)]">
        <ShoppingBag size={18} />
        <span class="font-medium">Total Orders</span>
      </div>
      <div class="text-3xl font-display font-bold text-[var(--color-text-primary)]">{totalOrders}</div>
    </div>
    
    <div class="glass p-5 rounded-2xl flex flex-col gap-2">
      <div class="flex items-center gap-2 text-[var(--color-text-secondary)]">
        <ArrowUpRight size={18} />
        <span class="font-medium">Average Order Value</span>
      </div>
      <div class="text-3xl font-display font-bold text-[var(--color-text-primary)]">{formatCurrency(averageOrderValue)}</div>
    </div>

    <div class="glass p-5 rounded-2xl flex flex-col gap-2">
      <div class="flex items-center gap-2 text-[var(--color-text-secondary)]">
        <Star size={18} />
        <span class="font-medium">Average Rating</span>
      </div>
      <div class="flex items-baseline gap-2">
        <span class="text-3xl font-display font-bold text-[var(--color-text-primary)]">{averageRating}</span>
        <span class="text-sm text-[var(--color-text-secondary)]">/ 5.0 ({feedbackCount} reviews)</span>
      </div>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Best Selling Items -->
    <div class="glass p-6 rounded-2xl">
      <h3 class="font-display font-bold text-lg text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
        <TrendingUp class="text-[var(--color-brand)]" size={20} /> Best Selling Items
      </h3>
      <div class="space-y-4">
        {#each itemSales() as item, i}
          <div class="flex items-center gap-4">
            <div class="w-8 h-8 rounded-full bg-[var(--color-brand)]/20 text-[var(--color-brand)] flex items-center justify-center font-bold text-sm">
              {i + 1}
            </div>
            <div class="flex-1">
              <h4 class="font-medium text-[var(--color-text-primary)]">{item.name}</h4>
              <p class="text-xs text-[var(--color-text-secondary)]">{item.qty} units sold</p>
            </div>
            <div class="font-bold text-[var(--color-text-primary)]">
              {formatCurrency(item.rev)}
            </div>
          </div>
        {/each}
        {#if itemSales().length === 0}
          <div class="text-[var(--color-text-secondary)] text-sm italic">No sales data available yet.</div>
        {/if}
      </div>
    </div>

    <!-- Peak Hours -->
    <div class="glass p-6 rounded-2xl">
      <h3 class="font-display font-bold text-lg text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
        <Clock class="text-[var(--color-brand)]" size={20} /> Peak Ordering Hours
      </h3>
      <div class="space-y-4">
        {#each peakHours() as ph}
          <div class="flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
            <div class="font-medium text-[var(--color-text-primary)]">
              {ph.hour === 0 ? '12 AM' : ph.hour < 12 ? `${ph.hour} AM` : ph.hour === 12 ? '12 PM' : `${ph.hour - 12} PM`}
            </div>
            <div class="text-sm font-bold bg-[var(--color-brand)]/10 text-[var(--color-brand)] px-3 py-1 rounded-full">
              {ph.count} orders
            </div>
          </div>
        {/each}
        {#if peakHours().length === 0}
          <div class="text-[var(--color-text-secondary)] text-sm italic">No order data available yet.</div>
        {/if}
      </div>
    </div>
  </div>
  
  <!-- Recent Feedback -->
  <div class="glass p-6 rounded-2xl mt-6">
    <h3 class="font-display font-bold text-lg text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
      <Star class="text-[var(--color-brand)]" size={20} /> Recent Feedback
    </h3>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each [...data.feedback].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6) as review}
        <div class="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <div class="flex gap-1 text-yellow-400">
              {#each Array(5) as _, i}
                <Star size={14} fill={i < review.rating ? 'currentColor' : 'none'} class={i >= review.rating ? 'text-[var(--color-border)]' : ''} />
              {/each}
            </div>
            <span class="text-xs text-[var(--color-text-secondary)]">
              {new Date(review.created_at).toLocaleDateString()}
            </span>
          </div>
          {#if review.comment}
            <p class="text-sm text-[var(--color-text-primary)] italic">"{review.comment}"</p>
          {:else}
            <p class="text-sm text-[var(--color-text-secondary)] italic">No comment left.</p>
          {/if}
        </div>
      {/each}
      {#if data.feedback.length === 0}
        <div class="text-[var(--color-text-secondary)] text-sm italic col-span-3">No feedback received yet.</div>
      {/if}
    </div>
  </div>
</div>
