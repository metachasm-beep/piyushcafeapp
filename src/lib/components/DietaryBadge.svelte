<script lang="ts">
  import { DIETARY_META } from '$lib/utils';
  import type { DietaryTag } from '$lib/types';

  let { tag }: { tag: DietaryTag } = $props();

  let meta = $derived(
    DIETARY_META[tag] || { label: tag, emoji: '🍽️', color: '#6b7280', bg: '#f3f4f6' }
  );
</script>

<span
  style="display:inline-flex;align-items:center;gap:4px;border-radius:99px;padding:3px 8px;font-size:10px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;background:{meta.bg};color:{meta.color};border:1px solid {meta.color}22;font-family:'Cabinet Grotesk',system-ui,sans-serif;"
>
  <span style="font-size:11px;">{meta.emoji}</span>
  {meta.label}
</span>
