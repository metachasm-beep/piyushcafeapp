<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";
  import { cva, type VariantProps } from "class-variance-authority";

  const cardVariants = cva(
    "liquid-glass rounded-3xl overflow-hidden transition-all duration-300",
    {
      variants: {
        variant: {
          default: "",
          interactive: "cursor-pointer hover:-translate-y-1 hover:shadow-[0_25px_65px_rgba(0,0,0,0.4)]",
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
