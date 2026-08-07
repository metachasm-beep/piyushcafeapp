<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";

  let { class: className = undefined, children, ...rest }: HTMLAttributes<HTMLDivElement> = $props();
</script>

<div
  class={cn("flex flex-col p-2 border-b border-slate-300 bg-slate-100", className)}
  {...rest}
>
  {@render children?.()}
</div>
