<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";

  let { class: className = undefined, children, ...rest }: HTMLAttributes<HTMLDivElement> = $props();
</script>

<div
  class={cn("flex flex-col space-y-1.5 p-6 transition-transform duration-500", className)}
  style="transform: translateZ(20px);"
  {...rest}
>
  {@render children?.()}
</div>
