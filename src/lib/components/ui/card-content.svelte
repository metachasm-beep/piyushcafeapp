<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";

  let { class: className = undefined, children, ...rest }: HTMLAttributes<HTMLDivElement> = $props();
</script>

<div
  class={cn("p-6 pt-0 transition-transform duration-500 hover:-translate-y-1 hover:translate-z-12", className)}
  style="transform: translateZ(30px);"
  {...rest}
>
  {@render children?.()}
</div>
