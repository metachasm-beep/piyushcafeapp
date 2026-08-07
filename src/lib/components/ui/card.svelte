<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";

  let { class: className = undefined, children, ...rest }: HTMLAttributes<HTMLDivElement> = $props();
</script>

<div
  class={cn("rounded-xl border border-zinc-200 bg-white text-zinc-950 shadow-sm", className)}
  {...rest}
>
  {@render children?.()}
</div>
