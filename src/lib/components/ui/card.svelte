<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";
  import { cva, type VariantProps } from "class-variance-authority";

  const cardVariants = cva(
    "bg-[#F5F5F7] rounded-3xl overflow-hidden transition-all duration-300",
    {
      variants: {
        variant: {
          default: "",
          interactive: "cursor-pointer hover:bg-[#EBEBEF]",
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
