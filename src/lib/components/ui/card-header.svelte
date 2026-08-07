<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";

  let { class: className = undefined, children, ...rest }: HTMLAttributes<HTMLDivElement> = $props();
</script>

<div
  class={cn("flex flex-col p-4 pb-2 border-b border-black/5", className)}
  {...rest}
>
  {@render children?.()}
</div>
