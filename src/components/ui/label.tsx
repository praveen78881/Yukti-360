"use client"

import * as React from "react"
import { Label as LabelPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        /* Small Oswald caps label, set above its field. */
        "flex items-center gap-2 font-display text-[10.5px] leading-none font-semibold uppercase tracking-[0.16em] text-[var(--ink-2)] select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:text-[var(--ink-3)] peer-disabled:cursor-not-allowed peer-disabled:text-[var(--ink-3)]",
        className
      )}
      {...props}
    />
  )
}

export { Label }
