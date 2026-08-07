<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";
  import { cva, type VariantProps } from "class-variance-authority";

  const cardVariants = cva(
    "rounded-xl border bg-white shadow-sm transition-all duration-300 ease-out",
    {
      variants: {
        variant: {
          default: "border-zinc-200 hover:border-zinc-300 hover:shadow-md",
          interactive: "border-zinc-200 cursor-pointer hover:border-indigo-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/10",
          destructive: "border-red-100 hover:border-red-200 bg-red-50/50",
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
