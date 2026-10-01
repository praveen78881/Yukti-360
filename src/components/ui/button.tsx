import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/* Buttons are Oswald uppercase 12.5px at .1em. The chamfer — cut top-left and
   bottom-right — is the product signature and lives ONLY here and on step
   badges. clip-path would cut a box-shadow, so the navy glow is drawn with
   drop-shadow so it follows the cut edge. Disabled goes sand on ink-3 and
   loses its shadow — never a faded navy. */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 font-display text-[12.5px] font-semibold uppercase tracking-[0.1em] whitespace-nowrap outline-none transition-[background-color,color,transform,filter,box-shadow] duration-[160ms] ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--navy)] disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "chamfer bg-[var(--navy)] text-white [filter:drop-shadow(0_8px_18px_rgba(23,69,127,0.42))] hover:bg-[var(--navy-2)] hover:-translate-y-px active:translate-y-0 disabled:bg-[var(--sand)] disabled:text-[var(--ink-3)] disabled:[filter:none]",
        destructive:
          "chamfer bg-[var(--bad)] text-white [filter:drop-shadow(0_8px_18px_rgba(178,59,51,0.38))] hover:bg-[#93302A] hover:-translate-y-px active:translate-y-0 disabled:bg-[var(--sand)] disabled:text-[var(--ink-3)] disabled:[filter:none]",
        outline:
          "chamfer border-[1.5px] border-[var(--sand)] bg-white/70 text-[var(--navy)] hover:border-[var(--sand-2)] hover:bg-white hover:-translate-y-px active:translate-y-0 disabled:border-[var(--sand)] disabled:bg-transparent disabled:text-[var(--ink-3)]",
        secondary:
          "chamfer border-[1.5px] border-[var(--sand)] bg-white/70 text-[var(--navy)] hover:border-[var(--sand-2)] hover:bg-white hover:-translate-y-px active:translate-y-0 disabled:border-[var(--sand)] disabled:bg-transparent disabled:text-[var(--ink-3)]",
        ghost:
          "rounded-[10px] text-[var(--ink-2)] hover:bg-[var(--navy-soft)] hover:text-[var(--navy-2)] disabled:text-[var(--ink-3)]",
        link: "rounded-[10px] font-sans text-sm normal-case tracking-normal text-[var(--navy)] underline-offset-4 hover:underline disabled:text-[var(--ink-3)]",
      },
      size: {
        default: "h-9 px-7 has-[>svg]:px-6",
        xs: "h-8 gap-1 px-4 text-[10.5px] tracking-[0.12em] has-[>svg]:px-3.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 px-5 text-[11.5px] has-[>svg]:px-4",
        lg: "h-11 px-9 text-[13.5px] has-[>svg]:px-7",
        icon: "size-9 rounded-[10px] px-0",
        "icon-xs": "size-7 rounded-lg px-0 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-[9px] px-0",
        "icon-lg": "size-10 rounded-[11px] px-0",
      },
    },
    compoundVariants: [
      /* Icon-only buttons keep a soft tile, never the chamfer — the restraint
         is what keeps the cut a signature. */
      { size: "icon", class: "[clip-path:none]" },
      { size: "icon-xs", class: "[clip-path:none]" },
      { size: "icon-sm", class: "[clip-path:none]" },
      { size: "icon-lg", class: "[clip-path:none]" },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
