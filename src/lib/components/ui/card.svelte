<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";
  import { cva, type VariantProps } from "class-variance-authority";

  const cardVariants = cva(
    "relative overflow-hidden bg-white/10 backdrop-blur-3xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-[32px] transition-all duration-500 ease-out",
    {
      variants: {
        variant: {
          default: "hover:border-white/40 hover:shadow-[0_8px_32px_rgba(255,255,255,0.1)]",
          interactive: "cursor-pointer hover:scale-[1.02] hover:border-white/50 hover:bg-white/20 hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]",
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
  <div class="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none rounded-[32px]"></div>
  <div class="relative z-10 h-full flex flex-col">
    {@render children?.()}
  </div>
</div>
