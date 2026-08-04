<script lang="ts">
  import type { OrderStatus } from '$lib/types';
  import { ORDER_STATUS_META } from '$lib/utils';
  
  let { status }: { status: OrderStatus } = $props();
  
  let meta = $derived(ORDER_STATUS_META[status] || { label: status, color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' });
</script>

<span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border {meta.color}">
  {#if status === 'pending' || status === 'preparing'}
    <span class="relative flex h-2 w-2">
      <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current"></span>
      <span class="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
    </span>
  {:else}
    <span class="h-2 w-2 rounded-full bg-current"></span>
  {/if}
  {meta.label}
</span>
