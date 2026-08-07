<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";

  let { class: className = undefined, ...rest }: HTMLAttributes<HTMLDivElement> = $props();
</script>

<div
  class={cn("animate-pulse rounded-md bg-white/5", className)}
  {...rest}
></div>
