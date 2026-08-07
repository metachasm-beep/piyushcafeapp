<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";

  let { class: className = undefined, children, ...rest }: HTMLAttributes<HTMLDivElement> = $props();
</script>

<div
  class={cn("flex flex-col p-6 border-b border-white/10 bg-white/5", className)}
  {...rest}
>
  {@render children?.()}
</div>
