<script lang="ts">
  import type { DietaryTag } from '$lib/types';
  import { DIETARY_META } from '$lib/utils';
  
  let { tag }: { tag: DietaryTag } = $props();
  
  let meta = $derived(DIETARY_META[tag] || { label: tag, emoji: '🍽️', color: 'bg-gray-500/20 text-gray-400' });
</script>

<span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wider uppercase backdrop-blur-md {meta.color} border border-white/5">
  <span class="text-xs">{meta.emoji}</span>
  {meta.label}
</span>
