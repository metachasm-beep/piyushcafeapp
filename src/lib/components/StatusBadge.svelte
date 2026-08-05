<script lang="ts">
  import { ORDER_STATUS_META } from '$lib/utils';
  import type { OrderStatus } from '$lib/types';

  let { status }: { status: OrderStatus } = $props();

  let meta = $derived(
    ORDER_STATUS_META[status] || { label: status, color: '#6b7280', bg: '#f3f4f6', step: 0 }
  );
</script>

<span
  style="display:inline-flex;align-items:center;gap:6px;border-radius:99px;padding:4px 10px;font-size:12px;font-weight:600;background:{meta.bg};color:{meta.color};border:1px solid {meta.color}33;font-family:'Cabinet Grotesk',system-ui,sans-serif;"
>
  {#if status === 'pending' || status === 'preparing'}
    <span style="position:relative;display:flex;width:8px;height:8px;">
      <span
        style="position:absolute;inset:0;border-radius:50%;background:currentColor;opacity:0.5;animation:status-ping 1.2s cubic-bezier(0,0,0.2,1) infinite;"
      ></span>
      <span style="position:relative;display:inline-flex;width:8px;height:8px;border-radius:50%;background:currentColor;"></span>
    </span>
  {:else}
    <span style="width:8px;height:8px;border-radius:50%;background:currentColor;"></span>
  {/if}
  {meta.label}
</span>

<style>
  @keyframes status-ping {
    75%,
    100% {
      transform: scale(2);
      opacity: 0;
    }
  }
</style>
