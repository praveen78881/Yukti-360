import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/* Chips are pills — never chamfered. Status uses the soft/solid pair of its
   colour; status colours never carry navigation. */
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2.5 py-0.5 font-display text-[10px] font-semibold uppercase tracking-[0.1em] whitespace-nowrap transition-[color,background-color,box-shadow] duration-[160ms] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--navy)] [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-[var(--navy)] text-white [a&]:hover:bg-[var(--navy-2)]",
        secondary:
          "bg-[var(--navy-soft)] text-[var(--navy-2)] [a&]:hover:bg-[#C6D9F1]",
        destructive:
          "bg-[var(--bad-soft)] text-[#8C2E27] [a&]:hover:bg-[#F2C4C0]",
        success: "bg-[var(--ok-soft)] text-[#245F45] [a&]:hover:bg-[#BBDFCE]",
        warning: "bg-[var(--warn-soft)] text-[#8A530F] [a&]:hover:bg-[#F0D4AE]",
        outline:
          "border-[var(--sand)] bg-white/70 text-[var(--ink-2)] [a&]:hover:bg-[var(--cream-2)]",
        ghost: "text-[var(--ink-2)] [a&]:hover:bg-[var(--cream-2)]",
        link: "font-sans normal-case tracking-normal text-[var(--navy)] underline-offset-4 [a&]:hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
