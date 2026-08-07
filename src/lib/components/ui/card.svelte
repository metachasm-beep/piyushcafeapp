<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";

  let { class: className = undefined, children, ...rest }: HTMLAttributes<HTMLDivElement> = $props();
</script>

<div
  class={cn(
    "rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl",
    "shadow-[0_30px_60px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]",
    "transition-all duration-500 ease-out",
    className
  )}
  style="transform-style: preserve-3d;"
  {...rest}
>
  {@render children?.()}
</div>
