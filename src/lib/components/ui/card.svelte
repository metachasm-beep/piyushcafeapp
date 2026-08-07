<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";
  import { cva, type VariantProps } from "class-variance-authority";

  const cardVariants = cva(
    "bg-white overflow-hidden",
    {
      variants: {
        variant: {
          default: "rounded-[18px]",
          interactive: "rounded-[18px] cursor-pointer active:scale-[0.98] transition-transform duration-200",
          groupedTop: "rounded-t-[18px] border-b border-gray-100",
          groupedMiddle: "border-b border-gray-100",
          groupedBottom: "rounded-b-[18px]",
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
  {@render children?.()}
</div>
