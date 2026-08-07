<script lang="ts">
  import { cn } from "$lib/utils";
  import { cva, type VariantProps } from "class-variance-authority";
  import type { HTMLAttributes } from "svelte/elements";

  const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    {
      variants: {
        variant: {
          default:
            "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
          secondary:
            "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
          destructive:
            "border-transparent bg-red-900/50 text-red-100 hover:bg-red-900/70",
          outline: "text-foreground",
          success: "border-transparent bg-emerald-900/50 text-emerald-100 hover:bg-emerald-900/70",
          warning: "border-transparent bg-amber-900/50 text-amber-100 hover:bg-amber-900/70",
        },
      },
      defaultVariants: {
        variant: "default",
      },
    }
  );

  type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

  let { class: className = undefined, variant = "default", children, ...rest }: HTMLAttributes<HTMLDivElement> & { variant?: BadgeVariant } = $props();
</script>

<div class={cn(badgeVariants({ variant }), className)} {...rest}>
  {@render children?.()}
</div>
