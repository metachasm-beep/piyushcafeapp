<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";
  import { cva, type VariantProps } from "class-variance-authority";

  const cardVariants = cva(
    "bg-white/90 backdrop-blur-md rounded-xl border border-black/5 shadow-sm overflow-hidden",
    {
      variants: {
        variant: {
          default: "",
          interactive: "cursor-pointer transition-colors duration-200 hover:bg-white",
        },
      },
      defaultVariants: {
        variant: "default",
      },
    }
  );

  type CardVariantProps = VariantProps<typeof cardVariants>;

  let { 
    class: className = undefined, 
    variant = "default",
    children, 
    ...rest 
  }: HTMLAttributes<HTMLDivElement> & { variant?: CardVariantProps["variant"] } = $props();
</script>

<div
  class={cn(cardVariants({ variant }), className)}
  {...rest}
>
  <div class="relative h-full flex flex-col">
    {@render children?.()}
  </div>
</div>
