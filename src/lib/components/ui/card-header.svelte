<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";

  let { class: className = undefined, children, ...rest }: HTMLAttributes<HTMLDivElement> = $props();
</script>

<div
  class={cn("flex flex-col p-6 pb-3 border-b border-white/10", className)}
  {...rest}
>
  {@render children?.()}
</div>
